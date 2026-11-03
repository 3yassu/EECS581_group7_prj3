use std::{
	net::{
		TcpListener, 
		TcpStream,
		Ipv4Addr,
		SocketAddrV4
	},
};

mod request;
use request::Request;
mod response;
use response::Response;
mod method;
mod error;
use error::Result;

type BStr = Box<str>;

// take in &str for address or search for open adddresses?
pub fn init_server() -> Result<()>{
	//let ipv4 = we can decide when we set up the server online;
	// Alternatively use port 0 to choose a random one
	let socket = SocketAddrV4::new(Ipv4Addr::LOCALHOST, 8080);
	let listener = TcpListener::bind(socket)?;
	//println!("PORT: {}", listener.local_addr()?.port());
	for stream in listener.incoming() {
		let stream = stream?;
		handle_connection(stream)?;
	}
	Ok(())
}

fn handle_connection(mut stream: TcpStream) -> Result<()>{
	let request = Request::headerless_from_stream(&stream)?;
	let response = Response::from_request(request)?;
	response.send(&mut stream)
}
