# Use the official Bun image
FROM oven/bun:1-alpine AS base

# Install Git and other necessary utilities
RUN apk add --no-cache git bash

# Set the working directory inside the container
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
FROM base AS prerelease
COPY --from=install /app/node_modules node_modules
COPY . .

# Final stage
FROM base AS release
COPY --from=install /app/node_modules node_modules
COPY --from=prerelease /app .

# Clone the public git repository
RUN git clone https://github.com/SteamDatabase/GameTracking-Deadlock.git /app/repo

# Copy the fetch and parse scripts into the container
COPY fetch.sh /app/fetch.sh
COPY pull_and_parse.sh /app/pull_and_parse.sh

# Make the scripts executable
RUN chmod +x /app/fetch.sh /app/pull_and_parse.sh

# Set the entrypoint to run the fetch script
ENTRYPOINT ["/bin/bash", "/app/fetch.sh"]
