use thirtyfour::prelude::*;
use thirtyfour::ChromeCapabilities;
use serde::Serialize;
use std::fmt;
use std::process::{Child, Command};
use std::time::Duration;
use std::env::consts::{OS, ARCH};
use std::path::Path;

struct ChromeDriverGuard(Child);

impl Drop for ChromeDriverGuard {
    fn drop(&mut self) {
        // Log failed kills/waits so leaked chromedriver process isn't silent.
        if let Err(err) = self.0.kill() {
            eprintln!("failed to kill chromedriver process: {err}");
        }
        if let Err(err) = self.0.wait() {
            eprintln!("failed to reap chromedriver process: {err}");
        }
    }
}

#[derive(Serialize)]
pub struct Recipe {
    pub ingredients_html: String,
    pub steps_html: String,
}

#[derive(Debug)]
pub enum ScraperError {
    WebDriver(WebDriverError),
    Runtime(std::io::Error),
    Json(serde_json::Error),
    DriverVersion(String)
}

impl fmt::Display for ScraperError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ScraperError::WebDriver(err) => write!(f, "webdriver error: {err}"),
            ScraperError::Runtime(err) => write!(f, "tokio runtime error: {err}"),
            ScraperError::Json(err) => write!(f, "json error: {err}"),
            ScraperError::DriverVersion(err) => write!(f, "driver version error: {err}"),
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

fn driver_filename() -> Result<&'static str> {
    match (OS, ARCH) {
		("linux", _) => Ok("linux-chromedriver"),
		("macos", "aarch64") => Ok("mac-arm64-chromedriver"),
		("macos", "x86_64") => Ok("mac-x64-chromedriver"),
		("windows", _) => Ok("windows-chromedriver.exe"),
		_ => Err(ScraperError::DriverVersion(format!("Web scraper does not support {OS} OS and {ARCH} architecture"))),
	}
}

// Owns its own tokio runtime so callers don't need one; returns the scraped recipe as a JSON string.
pub fn run() -> Result<String> {
    let driver_version = driver_filename()?;

    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .map_err(ScraperError::Runtime)?;
    runtime.block_on(run_async(driver_version))
}

async fn run_async(driver_version: &str) -> Result<String> {
    let driver_path = Path::new("./webdrivers").join(driver_version);
    let _chromedriver = ChromeDriverGuard(
        Command::new(&driver_path)
            .arg("--port=9515")
            .spawn()
            .unwrap_or_else(|_| panic!("Failed to start chromedriver at {}", driver_path.display())),
    );

    let mut caps = DesiredCapabilities::chrome();
    caps.add_chrome_arg("--headless=new")?;
    caps.add_chrome_arg("--disable-blink-features=AutomationControlled")?;
    caps.add_chrome_arg("--window-size=1920,1080")?;
    caps.add_chrome_arg("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")?;
    caps.add_chrome_option("excludeSwitches", ["enable-automation"])?;

    let driver = connect_with_retry("http://localhost:9515", caps).await?;

    driver.maximize_window().await?;

    let scrape_result = scrape(&driver, "https://www.allrecipes.com/recipe/9191/pumpkin-soup/").await;
    let quit_result = driver.quit().await;
    let recipe = scrape_result?;
    quit_result?;

    Ok(serde_json::to_string(&recipe)?)
}

async fn connect_with_retry(url: &str, caps: ChromeCapabilities) -> WebDriverResult<WebDriver> {
    let mut last_err = None;
    for _ in 0..20 {
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

async fn scrape(driver: &WebDriver, recipe_url: &str) -> WebDriverResult<Recipe> {
    driver.goto(recipe_url).await?;

    for _ in 0..20 {
        if !driver.title().await?.contains("Just a moment") {
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let html = driver.source().await?;
    let ingredients_html = html_selector(&html, "<ul class=\"mm-recipes-structured-ingredients__list\">", "</ul>");
    let steps_html = html_selector(&html, "<ol id=\"mntl-sc-block_30-0\" class=\"comp mntl-sc-block mntl-sc-block-startgroup mntl-sc-block-group--OL\">", "</ol>");

    Ok(Recipe { ingredients_html, steps_html })
}

fn html_selector(file: &str, start_tag: &str, end_tag: &str) -> String {
    let bytes = file.as_bytes();
    let start_tag = start_tag.as_bytes();
    let end_tag = end_tag.as_bytes();
    let mut start_tag_index = 0;
    let mut end_tag_index = 0;
    let mut write = false;

    let mut output = String::new();

    for &character in bytes.iter() {
        if character == start_tag[start_tag_index] {
            start_tag_index += 1;
            if start_tag_index == start_tag.len() {
                write = true;
                start_tag_index = 0;
            }
        } else {
            start_tag_index = 0;
        }

        if character == end_tag[end_tag_index] {
            end_tag_index += 1;
            if end_tag_index == end_tag.len() {
                write = false;
                end_tag_index = 0;
            }
        } else {
            end_tag_index = 0;
        }

        if write {
            output.push(character as char);
        }
    }

    output
}
