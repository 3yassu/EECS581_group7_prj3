use std::{
	net::{TcpListener, TcpStream},
	io::Result,
};

mod request;
use request::Request;
mod response;
use response::Response;

type BStr = Box<str>;

// take in &str for address or search for open adddresses?
pub fn init_server() -> Result<()>{
	let listener = TcpListener::bind("127.0.0.1:8080")?;
	for stream in listener.incoming() {
		let stream = stream?;
		handle_connection(stream)?;
	}
	Ok(())
}

fn handle_connection(mut stream: TcpStream) -> Result<()>{
	let request = Request::from_stream(&stream)?;
	let response = Response::from_request(request)?;
	response.send(&mut stream)
}
