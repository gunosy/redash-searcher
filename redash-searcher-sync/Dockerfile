# ref: https://dev.to/rogertorres/first-steps-with-docker-rust-30oi
FROM rust:1.68.0-bullseye as build

RUN USER=root cargo new --bin redash-searcher-sync
WORKDIR /redash-searcher-sync

# copy over your manifests
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

# this build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# copy your source tree
COPY ./src ./src

# build for release
RUN rm ./target/release/deps/redash_searcher_sync*
RUN cargo build --release

# our final base
FROM debian:bullseye-slim


RUN addgroup --system --gid 1001 redash-searcher
RUN adduser --system --uid 1001 redash-searcher-sync

RUN apt-get update \
    && apt-get install -y ca-certificates \
    && update-ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# copy the build artifact from the build stage
COPY --from=build --chown=redash-searcher-sync:redash-searcher /redash-searcher-sync/target/release/redash-searcher-sync .

USER redash-searcher-sync

# set the startup command to run your binary
ENTRYPOINT ["./redash-searcher-sync"]
