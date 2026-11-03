use std::{
	io::{BufRead, BufReader},
	net::TcpStream, path::{Path, PathBuf},
};
use super::{BStr, method::Method, error::{Error, Result, ErrorKind}};



pub struct Request {
	method: Method,
	path: PathBuf,
	//headers: HashMap<BStr, BStr>
	vers: BStr
}

impl Request {

	pub fn build_path(s: &str) -> Result<PathBuf> {
    let mut path = PathBuf::from("../frontend/dist/");
		let req_path = s.trim_start_matches('/');
		if req_path.is_empty() {
			path.push("index.html")
		} else {
			for d in req_path.split("/") {
				if d == ".." {path.pop();}
				else {path.push(d)}
			}
		}
		if !path.starts_with("../frontend/dist") {
			return Err(Error::new(ErrorKind::PermissionDenied));
		} else if path.is_dir() {
			path.push("index.html");
		}

		Ok(path)
	}
	pub fn headerless_from_stream(stream: &TcpStream) -> Result<Self>{
		let mut buf_reader = BufReader::new(stream);
		let mut req_line = String::new();

		buf_reader.read_line(&mut req_line)
			.map_err(|_| Error::new(ErrorKind::InvalidRequest))?;

		let parts: Vec<_> = req_line.split_whitespace().collect();

		if parts.len() != 3 {
			return Err(Error::new(ErrorKind::InvalidRequest));
		}

		let method = parts[0].try_into()?;
		let path = Request::build_path(parts[1])?;
		// Errorchecking for the version
		let vers = parts[2].into();
		
		Ok(Self {method, path, vers})
	}

	pub fn path(&self) -> &Path {
		&self.path
	}
}
