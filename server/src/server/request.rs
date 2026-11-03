use std::{
	io::{BufReader, BufRead},
	net::TcpStream,
};
use super::{BStr, method::Method, error::{Error, Result, ErrorKind}};

pub struct Request {
	method: Method,
	path: BStr,
	vers: BStr
}

impl Request {
	pub fn from_stream(stream: &TcpStream) -> Result<Self>{
		let mut buf_reader = BufReader::new(stream);
		let mut req_line = String::new();

		buf_reader.read_line(&mut req_line)
			.map_err(|_| Error::new(ErrorKind::InvalidRequest))?;

		let parts: Vec<_> = req_line.split_whitespace().collect();

		if parts.len() != 3 {
			return Err(Error::new(ErrorKind::InvalidRequest));
		}


		//TODO: more error checking :)
		let method = parts[0].try_into()?;
		let path = parts[1].into();
		let vers = parts[2].into();
		
		Ok(Self {method, path, vers})
	}

	pub fn path(&self) -> &str {
		&self.path
	}
}
