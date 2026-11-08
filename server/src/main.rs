mod server;
mod scraper;
use server::init_server;

// Reads "-- system=<name>" (e.g. linux, windows, mac) to pick ./webdrivers/<name>-chromedriver.
fn parse_driver_version() -> String {
	std::env::args()
		.find_map(|arg| arg.strip_prefix("system=").map(str::to_owned))
		.unwrap_or_else(|| "linux".to_string())
}

#[tokio::main]
async fn main() {
	let driver_version = parse_driver_version();

	let scraper_handle = tokio::spawn(async move {
		if let Err(err) = scraper::run(&driver_version).await {
			eprintln!("scraper failed: {err:?}");
		}
	});

	let server_handle = tokio::task::spawn_blocking(|| {
		init_server().expect("failed to start server");
	});

	let _ = tokio::join!(scraper_handle, server_handle);
}
