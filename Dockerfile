# Use Debian-based Node image for glibc compatibility
FROM node:20-slim

# Install Git, Bash, and other necessary utilities
RUN apt-get update && apt-get install -y \
    git \
    dos2unix \
    libstdc++6 \
    libicu72 \
    cron \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \
    && ln -sf /usr/local/bin/bun /usr/local/bin/bunx

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
RUN dos2unix /app/fetch.sh /app/pull_and_parse.sh /app/commit_parsed_data.sh /app/process_all_commits.sh /app/extract_game_data.sh

# Make the scripts executable
RUN chmod +x /app/fetch.sh /app/pull_and_parse.sh /app/commit_parsed_data.sh /app/process_all_commits.sh /app/extract_game_data.sh

# Configure Git
RUN git config --global init.defaultBranch master
RUN git config --global user.email "patron@deadbot.gg"
RUN git config --global user.name "Patron"

# Set up cron job
RUN echo "*/5 * * * * /bin/bash /app/fetch.sh >> /var/log/fetch.log 2>&1" > /etc/cron.d/fetch-cron
RUN chmod 0644 /etc/cron.d/fetch-cron
RUN crontab /etc/cron.d/fetch-cron

# Create log files and set permissions
RUN touch /var/log/fetch.log /var/log/cron.log && chmod 666 /var/log/fetch.log /var/log/cron.log

# Start cron and run initial fetch
CMD ["bash", "-c", "service cron start && echo 'Starting cron daemon...' && echo 'Running initial fetch...' && /bin/bash /app/fetch.sh && echo 'Initial fetch completed. Tailing logs...' && tail -f /var/log/fetch.log /var/log/cron.log"]
