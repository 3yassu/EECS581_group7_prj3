mod server;
use server::init_server;
use heychef_scraper::scraper; 


fn main() {
	let server_handle = std::thread::spawn(|| {
		init_server().expect("failed to start server");
	});

	match scraper::run() {
		Ok(recipe_json) => println!("scraped recipe: {recipe_json}"),
		Err(err) => eprintln!("scraper failed: {err:?}"),
	}

	let _ = server_handle.join();
}