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
pub async fn init_server() -> Result<()>{
	// listen on all IPv4 interfaces so Docker can forward connections to the server
	let socket = SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, 8080);
	let listener = TcpListener::bind(socket)?;
	//println!("PORT: {}", listener.local_addr()?.port());
	for stream in listener.incoming() {
		let stream = stream?;
		if let Err(err) = handle_connection(stream).await{ // gracefully logs connection errors
			eprintln!("connection error: {err:?}");
		}
	}
	Ok(())
}

async fn handle_connection(mut stream: TcpStream) -> Result<()>{
	let response = Request::from_stream(&stream)
		.and_then(Response::try_from).unwrap_or_else(Response::from);
	response.send(&mut stream)
}
