# ref: https://dev.to/rogertorres/first-steps-with-docker-rust-30oi
FROM rust:1.66.0-bullseye as build

RUN USER=root cargo new --bin redash-search-sync
WORKDIR /redash-search-sync

# copy over your manifests
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

# this build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# copy your source tree
COPY ./src ./src

# build for release
RUN rm ./target/release/deps/redash_search_sync*
RUN cargo build --release

# our final base
FROM debian:bullseye-slim


RUN addgroup --system --gid 1001 redash-search
RUN adduser --system --uid 1001 redash-search-sync

# copy the build artifact from the build stage
COPY --from=build --chown=redash-search-sync:redash-search /redash-search-sync/target/release/redash-search-sync .

USER redash-search-sync

# set the startup command to run your binary
ENTRYPOINT ["./redash-search-sync"]
