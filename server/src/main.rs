mod server;
use server::init_server;

fn main() {
	init_server().expect("failed to start server");
}
