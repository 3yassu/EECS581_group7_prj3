use thirtyfour::prelude::*;
use thirtyfour::ChromeCapabilities;
use serde::Serialize;
use std::fmt;
use std::time::Duration;

use crate::tags::{tags, SiteTags};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Ingredient {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quantity: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    pub name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeStep {
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timer_seconds: Option<u32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Recipe {
    pub title: String,
    pub source_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub servings: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_time_minutes: Option<u32>,
    pub ingredients: Vec<Ingredient>,
    pub steps: Vec<RecipeStep>,
}

#[derive(Debug)]
pub enum ScraperError {
    WebDriver(WebDriverError),
    Runtime(std::io::Error),
    Json(serde_json::Error),
    UnsupportedSite(String),
}

impl fmt::Display for ScraperError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ScraperError::WebDriver(err) => write!(f, "webdriver error: {err}"),
            ScraperError::Runtime(err) => write!(f, "tokio runtime error: {err}"),
            ScraperError::Json(err) => write!(f, "json error: {err}"),
            ScraperError::UnsupportedSite(url) => write!(f, "no tags configured for site: {url}"),
        }
    }
}

impl std::error::Error for ScraperError {}

impl From<WebDriverError> for ScraperError {
    fn from(err: WebDriverError) -> Self {
        ScraperError::WebDriver(err)
    }
}

impl From<serde_json::Error> for ScraperError {
    fn from(err: serde_json::Error) -> Self {
        ScraperError::Json(err)
    }
}

pub type Result<T> = std::result::Result<T, ScraperError>;

// Owns its own tokio runtime so callers don't need one; returns the scraped recipe as a JSON string.
pub fn run() -> Result<String> {
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .map_err(ScraperError::Runtime)?;
    runtime.block_on(run_async())
}

async fn run_async() -> Result<String> {
    let webdriver_url = std::env::var("WEBDRIVER_URL")
        .unwrap_or_else(|_| "http://localhost:4444".to_string());

    let mut caps = DesiredCapabilities::chrome();
    caps.add_chrome_arg("--headless=new")?;
    caps.add_chrome_arg("--disable-blink-features=AutomationControlled")?;
    caps.add_chrome_arg("--window-size=1920,1080")?;
    caps.add_chrome_arg("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")?;
    caps.add_chrome_option("excludeSwitches", ["enable-automation"])?;

    let driver = connect_with_retry(&webdriver_url, caps).await?;
    
    driver.maximize_window().await?;

    let scrape_result = scrape(&driver, "https://www.allrecipes.com/savory-dutch-baby-recipe-12148516").await;
    let quit_result = driver.quit().await;
    let recipe = scrape_result??;
    quit_result?;

    Ok(serde_json::to_string(&recipe)?)
}

async fn connect_with_retry(url: &str, caps: ChromeCapabilities) -> WebDriverResult<WebDriver> {
    let mut last_err = None;
    for _ in 0..60 {
        match WebDriver::new(url, caps.clone()).await {
            Ok(driver) => return Ok(driver),
            Err(error) => {
                last_err = Some(error);
                tokio::time::sleep(Duration::from_millis(250)).await;
            }
        }
    }
    Err(last_err.expect("at least one connection attempt is always made"))
}

async fn scrape(driver: &WebDriver, recipe_url: &str) -> WebDriverResult<Result<Recipe>> {
    driver.goto(recipe_url).await?;

    for _ in 0..20 {
        if !driver.title().await?.contains("Just a moment") {
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let Some(site_tags) = tags(recipe_url).into_iter().next() else {
        return Ok(Err(ScraperError::UnsupportedSite(recipe_url.to_string())));
    };

    let html = driver.source().await?;
    let title = find_all_between(&html, site_tags.title_start, site_tags.title_end)
        .first()
        .map(|value| value.trim().to_string())
        .unwrap_or_default();
    let servings = find_all_between(&html, site_tags.servings_start, site_tags.servings_end)
        .first()
        .and_then(|value| parse_leading_number(value.trim()));
    let total_time_minutes = find_all_between(&html, site_tags.time_start, site_tags.time_end)
        .first()
        .and_then(|value| parse_minutes(value.trim()));
    let ingredients_html = html_selector(&html, site_tags.ingredients_start, site_tags.ingredients_end);
    let steps_html = html_selector(&html, site_tags.steps_start, site_tags.steps_end);
    let ingredients = ingredient_selector(&ingredients_html, &site_tags);
    let step_texts = steps_selector(&steps_html, &site_tags);
    let step_seconds = extract_step_time(&step_texts);
    let steps = step_texts
        .into_iter()
        .zip(step_seconds)
        .map(|(text, seconds)| RecipeStep {
            text,
            timer_seconds: (seconds > 0).then_some(seconds),
        })
        .collect();

    Ok(Ok(Recipe {
        title,
        source_url: recipe_url.to_string(),
        servings,
        total_time_minutes,
        ingredients,
        steps,
    }))
}

fn find_all_between<'a>(html: &'a str, start_tag: &str, end_tag: &str) -> Vec<&'a str> {
    let mut matches = Vec::new();
    let mut rest = html;

    while let Some(start_index) = rest.find(start_tag) {
        let after_start = &rest[start_index + start_tag.len()..];
        let Some(end_index) = after_start.find(end_tag) else {
            break;
        };
        matches.push(&after_start[..end_index]);
        rest = &after_start[end_index + end_tag.len()..];
    }

    matches
}

fn html_selector(file: &str, start_tag: &str, end_tag: &str) -> String {
    find_all_between(file, start_tag, end_tag).concat()
}

// Extracts the leading run of digits as a number, ignoring any trailing unit text (e.g. "6 servings" -> 6).
fn parse_leading_number(value: &str) -> Option<u32> {
    let digits: String = value.chars().take_while(|ch| ch.is_ascii_digit()).collect();
    digits.parse().ok()
}

fn parse_minutes(value: &str) -> Option<u32> {
    let mut total = 0u32;
    let mut found_any = false;
    let mut tokens = value.split_whitespace().peekable();

    while let Some(token) = tokens.next() {
        let Ok(amount) = token.parse::<u32>() else { continue };
        let Some(unit) = tokens.peek() else { continue };
        let unit = unit.to_ascii_lowercase();

        if unit.starts_with("hr") {
            total += amount * 60;
            found_any = true;
        } else if unit.starts_with("min") {
            total += amount;
            found_any = true;
        }
    }

    found_any.then_some(total)
}

pub fn ingredient_selector(html: &str, tags: &SiteTags) -> Vec<Ingredient> {
    let [quantity_start, quantity_end, unit_start, unit_end, name_start, name_end] =
        tags.ingredients_tags;

    find_all_between(html, tags.ingredient_item_start, tags.ingredient_item_end)
        .into_iter()
        .map(|item| {
            let quantity = find_all_between(item, quantity_start, quantity_end)
                .first()
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let unit = find_all_between(item, unit_start, unit_end)
                .first()
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let name = find_all_between(item, name_start, name_end)
                .first()
                .map(|value| value.trim().to_string())
                .unwrap_or_default();

            Ingredient { quantity, unit, name }
        })
        .collect()
}

// Parses the steps section HTML into one string per step.
pub fn steps_selector(html: &str, tags: &SiteTags) -> Vec<String> {
    let [step_start, step_end] = tags.steps_tags;

    find_all_between(html, step_start, step_end)
        .into_iter()
        .map(|step| step.trim().to_string())
        .collect()
}

// Finds a duration mentioned in each step (e.g. "20 minutes", "12-15 mins"), in seconds; 0 if none found.
pub fn extract_step_time(steps: &[String]) -> Vec<u32> {
    steps.iter().map(|step| parse_step_seconds(step)).collect()
}

fn parse_step_seconds(step: &str) -> u32 {
    // Splitting on '-' too turns ranges like "12-15" into separate tokens, so the scan below
    // naturally keeps the last number before the unit, same as it does for "1 to 2 minutes".
    let words: Vec<&str> = step
        .split(|ch: char| ch.is_whitespace() || ch == '-')
        .filter(|word| !word.is_empty())
        .collect();

    for (index, word) in words.iter().enumerate() {
        let Ok(amount) = word.trim_matches(|ch: char| !ch.is_ascii_digit()).parse::<u32>() else { continue };
        let Some(next_word) = words.get(index + 1) else { continue };
        let unit = next_word
            .trim_matches(|ch: char| !ch.is_ascii_alphabetic())
            .to_ascii_lowercase();

        let multiplier = if unit.starts_with("hr") || unit.starts_with("hour") {
            3600
        } else if unit.starts_with("min") {
            60
        } else if unit.starts_with("sec") {
            1
        } else {
            continue;
        };

        return amount * multiplier;
    }

    0
}
