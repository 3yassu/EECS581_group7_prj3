use super::{BStr, Request, error::{Result, Error, ErrorKind}};
use std::{
	fs,
	net::TcpStream,
	io::Write,
	path::{PathBuf, Path},
};

pub struct Response {
	pub code: u16,
	pub text: BStr,
	pub headers: Vec<(BStr, BStr)>,
	pub inner: Vec<u8>,
}

impl Response {
	fn get_type(path: &Path) -> &'static str {
	    match path.extension().and_then(std::ffi::OsStr::to_str) {
	        Some("html") => "text/html",
	        Some("css") => "text/css",
	        Some("js") => "application/javascript",
	        Some("json") => "application/json",
	        Some("png") => "image/png",
	        Some("jpg") | Some("jpeg") => "image/jpeg",
	        Some("gif") => "image/gif",
  	      Some("svg") => "image/svg+xml",
    	    _ => "application/octet-stream",
    	}
	}

	pub fn from_request(request: Request) -> Result<Self>{
    let mut path = PathBuf::from("../frontend/dist/");
		let req_path = request.path().trim_start_matches('/');
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
		}
		
		if path.is_file() {
			let inner = fs::read(&path)?;
			let headers = vec![("Content-Type".into(), Response::get_type(&path).into())];
      return Ok(Self {code: 200, text: "OK".into(), headers, inner});
		} else if path.is_dir() {
			path.push("index.html");
			if path.is_file() {
				let inner = fs::read(&path)?;
				let headers = vec![("Content-Type".into(), Response::get_type(&path).into())];
      	return Ok(Self {code: 200, text: "OK".into(), headers, inner});
			}
		}
    Ok(Self {code: 404, text: "NOT FOUND".into(), headers: Vec::new(), inner: Vec::new()})
	}


	pub fn send(&self, stream: &mut TcpStream) -> Result<()>{
    write!(stream, "HTTP/1.1 {} {}\r\n", self.code, self.text)?;
		for (name, value) in &self.headers {
    	write!(stream, "{}: {}\r\n", name, value)?;
		}
		write!(stream, "\r\n")?;
		stream.write_all(&self.inner)?;
		stream.flush()?;
		Ok(())
	}
}
