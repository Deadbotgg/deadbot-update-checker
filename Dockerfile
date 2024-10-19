# Use the official Bun image
FROM oven/bun:1-alpine

# Install Git, Bash, and other necessary utilities
RUN apk add --no-cache git bash dos2unix

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create directories for scripts and repo
RUN mkdir -p /app/repo

# Ensure scripts use LF line endings
RUN dos2unix /app/fetch.sh /app/pull_and_parse.sh /app/commit_parsed_data.sh

# Make the scripts executable
RUN chmod +x /app/fetch.sh /app/pull_and_parse.sh /app/commit_parsed_data.sh

# Configure Git
RUN git config --global init.defaultBranch master
RUN git config --global user.email "patron@deadbot.gg"
RUN git config --global user.name "Patron"

# Set up cron job
RUN echo "*/5 * * * * /bin/bash /app/fetch.sh >> /var/log/fetch.log 2>&1" > /etc/crontabs/root

# Create log files and set permissions
RUN touch /var/log/fetch.log /var/log/cron.log && chmod 666 /var/log/fetch.log /var/log/cron.log

# Start cron and run initial fetch
CMD crond -f -d 8 & \
    echo "Starting cron daemon..." && \
    echo "Running initial fetch..." && \
    /bin/bash /app/fetch.sh && \
    echo "Initial fetch completed. Tailing logs..." && \
    tail -f /var/log/fetch.log /var/log/cron.log
