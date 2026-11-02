all: run

build:
	-cd frontend
	-npm install
	-npm run build 
	-cd ..

run: build
	-cd server
	-cargo run



