mod server;
use server::init_server;
use heychef_scraper::scraper; 

fn main() {
	let driver_version = "linux"; // other options: mac-x64, mac-arm, windows

	let server_handle = std::thread::spawn(|| {
		init_server().expect("failed to start server");
	});

	match scraper::run(&driver_version) {
		Ok(recipe_json) => println!("scraped recipe: {recipe_json}"),
		Err(err) => eprintln!("scraper failed: {err:?}"),
	}

	let _ = server_handle.join();
}