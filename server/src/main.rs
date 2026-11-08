mod server;
use server::init_server;
use heychef_scraper::scraper; // scraper lives in the heychef_scraper lib crate (src/lib.rs + src/scraper.rs)

// Reads "-- system=<name>" (e.g. linux, windows, mac) to pick ./webdrivers/<name>-chromedriver.
fn parse_driver_version() -> String {
	std::env::args()
		.find_map(|arg| arg.strip_prefix("system=").map(str::to_owned))
		.unwrap_or_else(|| "linux".to_string())
}

fn main() {
	let driver_version = parse_driver_version();

	let server_handle = std::thread::spawn(|| {
		init_server().expect("failed to start server");
	});

	match scraper::run(&driver_version) {
		Ok(recipe_json) => println!("scraped recipe: {recipe_json}"),
		Err(err) => eprintln!("scraper failed: {err:?}"),
	}

	let _ = server_handle.join();
}
