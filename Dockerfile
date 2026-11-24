FROM node:24-bookworm AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM rust:1-bookworm AS server-build
WORKDIR /app
COPY scraper/ ./scraper/
COPY server/ ./server/
RUN cargo build --release --locked --manifest-path server/Cargo.toml

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server
COPY --from=server-build /app/server/target/release/server ./server
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8080
ENTRYPOINT ["./server"]