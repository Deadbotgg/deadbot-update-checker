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


RUN git clone https://github.com/Deadbotgg/deadbot-update-checker.git /app

# Clone the public git repository
RUN git clone https://github.com/SteamDatabase/GameTracking-Deadlock.git /app/repo

# Copy the pull and run script into the container
COPY fetch.sh /app/fetch.sh

# Make the script executable
RUN chmod +x /app/fetch.sh