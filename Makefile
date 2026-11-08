.PHONY= build run clean dev

all: run

build:
	npm --prefix frontend run build

run: build
	cd server && cargo run

clean:
	rm -rf frontend/dist
	cd server && cargo clean

dev:
	npm --prefix frontend run dev