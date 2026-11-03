use std::str::FromStr;
use super::error::{Error, ErrorKind};

#[non_exhaustive]
pub enum Method {
	Get,
}

impl TryFrom<&str> for Method {
	type Error = Error;

	fn try_from(value: &str) -> Result<Self, Self::Error> {
		match value {
			"GET" => Ok(Method::Get),
			_ => Err(Error::new(ErrorKind::InvalidMethod))
		}
	}
}





