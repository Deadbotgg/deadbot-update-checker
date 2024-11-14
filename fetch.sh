#!/bin/bash

# Set up logging
LOGFILE="/var/log/fetch.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "$(date -u): Starting fetch script"

# Ensure we're in the correct directory
cd /app/repo || { echo "$(date -u): Failed to change to /app/repo directory"; exit 1; }

echo "$(date -u): Current directory: $(pwd)"

# Check if the directory is a Git repository
if [ ! -d ".git" ]; then
    echo "$(date -u): Git repository not found. Initializing new repository."
    git init
    git remote add origin https://github.com/SteamDatabase/GameTracking-Deadlock.git
    git fetch origin
    git checkout -b master origin/master
else
    echo "$(date -u): Git repository found. Fetching updates."
    git fetch origin
fi

# Ensure we're on the master branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
    echo "$(date -u): Switching to master branch"
    git checkout master
fi

# Check if there are any changes
if git diff --quiet HEAD origin/master; then
    echo "$(date -u): No changes detected."
    echo "$(date -u): Running pull_and_parse.sh"
    GAME_REPO=/app/repo /bin/bash /app/pull_and_parse.sh
else
    echo "$(date -u): Changes detected. Pulling updates and parsing data..."
    git pull origin master
    echo "$(date -u): Running pull_and_parse.sh"
    GAME_REPO=/app/repo /bin/bash /app/pull_and_parse.sh
fi

echo "$(date -u): Fetch script completed"
