use std::{
	io::{BufRead, BufReader},
	net::TcpStream, path::{Path, PathBuf},
	collections::HashMap,
};
use super::{BStr, method::Method, error::{Error, Result, ErrorKind}};


#[derive(Debug)]
pub struct Request {
	method: Method,
	headers: HashMap<BStr, BStr>,
	path: PathBuf,
	vers: BStr
	// message_body: BStr
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
	pub fn from_stream(stream: &TcpStream) -> Result<Self>{
		let mut lines = BufReader::new(stream).lines();
		let req_line =  lines.next().ok_or(Error::new(ErrorKind::InvalidRequest))??;
		let parts: Vec<_> = req_line.split_whitespace().collect();

		if parts.len() != 3 {
			return Err(Error::new(ErrorKind::InvalidRequest));
		}

		let method = parts[0].try_into()?;
		let path = Request::build_path(parts[1])?;
		// Errorchecking for the version
		let vers = parts[2].into();

		// Since lines is used by_ref, it will still be usable after headers is set, better yet 
		// it SHOULD be placed either ON the message_body's first line or just before it
		let headers = 
			lines.by_ref().map_while(|r| {
				let s = r.ok()?;
				s.split_once(':')
					.map(|(k, v)| (k.trim().into(), v.trim().into()))
			}).collect();
		// TODO: support for method_body
		Ok(Self {method, path, headers, vers})

	}

	pub fn path(&self) -> &Path {
		&self.path
	}
}
