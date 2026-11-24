mod server;
use server::init_server;
use heychef_scraper::scraper;
//use async_runtime::main;
//#[main]
fn main() {
	std::thread::spawn(|| {
		match scraper::run() {
			Ok(recipe_json) => println!("scraped recipe: {recipe_json}"),
			Err(err) => eprintln!("scraper failed: {err:?}"),
		}
	});

	smol::block_on(async {init_server().await
		.expect("failed to start server")});
}
