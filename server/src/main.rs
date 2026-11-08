use thirtyfour::prelude::*;
use thirtyfour::ChromeCapabilities;
use std::fs;
use std::process::{Child, Command};
use std::time::Duration;

struct ChromeDriverGuard(Child);

impl Drop for ChromeDriverGuard {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[tokio::main]
async fn main() -> WebDriverResult<()> {
    let _chromedriver = ChromeDriverGuard(
        Command::new("./webdrivers/linux-chromedriver")
            .arg("--port=9515")
            .spawn()
            .expect("Failed to start chromedriver at ./webdrivers/linux-chromedriver"),
    );

    let mut caps = DesiredCapabilities::chrome();
    caps.add_chrome_arg("--headless=new")?;
    caps.add_chrome_arg("--disable-blink-features=AutomationControlled")?;
    caps.add_chrome_arg("--window-size=1920,1080")?;
    caps.add_chrome_arg("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")?;
    caps.add_chrome_option("excludeSwitches", ["enable-automation"])?;

    let driver = connect_with_retry("http://localhost:9515", caps).await?;

    driver.maximize_window().await?;
    
    let scrape_result = scrape(&driver, "https://www.allrecipes.com/one-pot-teriyaki-chicken-casserole-recipe-11960287").await;
    let quit_result = driver.quit().await;
    scrape_result?;
    quit_result
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

async fn scrape(driver: &WebDriver, recipe_url: &str) -> WebDriverResult<()> {
    driver.goto(recipe_url).await?;

    for _ in 0..20 {
        if !driver.title().await?.contains("Just a moment") {
            break;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let html = driver.source().await?;
    fs::write("output.txt", html)?;

    Ok(())
}
