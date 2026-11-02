use std::{
	io::{Result, Error, ErrorKind, BufReader, BufRead},
	net::TcpStream,
};
use super::BStr;


pub struct Request {
	method: BStr,
	path: BStr,
	vers: BStr
}

impl Request {
	pub fn from_stream(stream: &TcpStream) -> Result<Self>{
		let mut buf_reader = BufReader::new(stream);
		let mut req_line = String::new();

		buf_reader.read_line(&mut req_line)?;

		let parts: Vec<_> = req_line.split_whitespace().collect();

		if parts.len() != 3 {
			return Err(Error::new(ErrorKind::InvalidData, "Invalid request"));
		}


		//TODO: more error checking :)
		let method = parts[0].into();
		let path = parts[1].into();
		let vers = parts[2].into();
		
		Ok(Self {method, path, vers})
	}

	pub fn path(&self) -> &str {
		&self.path
	}
}
