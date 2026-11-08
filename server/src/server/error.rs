
pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub struct Error {
	inner: ErrorKind,
}

#[derive(Debug)]
#[non_exhaustive]
pub enum ErrorKind {
	InvalidMethod,
	InvalidRequest,
	PermissionDenied,
	IO(std::io::Error),
}

impl From<std::io::Error> for Error {
	fn from(err: std::io::Error) -> Self {
		Self {
			inner: ErrorKind::IO(err)
		}
	}
}


impl Error {
	pub fn new(inner: ErrorKind) -> Self {
		Self {inner}
	}
}

