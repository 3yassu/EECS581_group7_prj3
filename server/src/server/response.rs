use super::{BStr, Request, error::{Result, Error, ErrorKind}};
use std::{
	fs, io::Write, net::TcpStream, path::{Path, PathBuf}
};

pub struct Response {
	pub code: u16,
	pub text: BStr,
	pub headers: Vec<(BStr, BStr)>,
	pub inner: Vec<u8>,
}

impl TryFrom<Request> for Response {
	type Error = Error;
	fn try_from(request: Request) -> Result<Self>{		
		let path = request.path();
		let inner = fs::read(path)?;
		let headers = vec![("Content-Type".into(), Response::get_type(path).into())];
		Ok(Self { code: 200, text: "OK".into(), headers, inner })
	}
}

impl From<Error> for Response {

	fn from(value: Error) -> Self {
		let (code, text) = match value.kind() {
			ErrorKind::InvalidRequest => (400, "BAD REQUEST"),
			ErrorKind::PermissionDenied => (403, "FORBIDDEN"),
			ErrorKind::NotFound => (404, "NOT FOUND"),
			ErrorKind::InvalidMethod => (405, "METHOD NOT ALLOWED"),
			ErrorKind::IO(_) => (500, "INTERNAL SERVER ERROR"),
		};
    let path = PathBuf::from("../frontend/dist/index.html");
		let inner = fs::read(path).unwrap_or_default();
		Self { code, text: text.into(), headers: Vec::new(), inner }
	}
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
