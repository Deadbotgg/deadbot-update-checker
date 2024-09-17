# Use the official Bun image
FROM oven/bun:1-alpine AS base

# Install Git and other necessary utilities
RUN apk add --no-cache git bash

# Set the working directory inside the container
WORKDIR /app

# Clone the public git repository
RUN git clone https://github.com/SteamDatabase/GameTracking-Deadlock.git /app/repo

# Copy the pull and run script into the container
COPY fetch.sh /app/fetch.sh

# Make the script executable
RUN chmod +x /app/fetch.sh