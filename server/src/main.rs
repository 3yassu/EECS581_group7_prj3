mod server;
mod scraper;
use server::init_server;

#[tokio::main]
async fn main() {
	let scraper_handle = tokio::spawn(async {
		if let Err(err) = scraper::run().await {
			eprintln!("scraper failed: {err:?}");
		}
	});

	let server_handle = tokio::task::spawn_blocking(|| {
		init_server().expect("failed to start server");
	});

	let _ = tokio::join!(scraper_handle, server_handle);
}
