mod server;
use server::init_server;
use heychef_scraper::scraper;
//use async_runtime::main;
use smol::block_on;


//#[main]
fn main() {

	smol::block_on(async {init_server().await
		.expect("failed to start server")});

	match scraper::run() {
		Ok(recipe_json) => println!("scraped recipe: {recipe_json}"),
		Err(err) => eprintln!("scraper failed: {err:?}"),
	}
}
