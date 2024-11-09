#!/bin/bash

set -e

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set."
    exit 1
fi

# Check if GAME_REPO is set
if [ -z "$GAME_REPO" ]; then
    echo "Error: GAME_REPO environment variable is not set."
    exit 1
fi

# Change to the app directory
cd /app

# Run index.ts using Bun
echo "Running parser..."
bun run index.ts

echo "Parsing complete."

# Change to output directory
cd /output

# Initialize git if not already a repository
if [ ! -d ".git" ]; then
    git init
    git remote add origin "https://${GITHUB_TOKEN}@github.com/Deadbotgg/deadlock-data.git"
else
    # If it's already a git repository, update the remote URL
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/Deadbotgg/deadlock-data.git"
fi

# Fetch the latest changes
git fetch origin

# Make sure we're on main
git checkout main || git checkout -b main

# Get current game commit hash and date from GAME_REPO
GAME_COMMIT=$(cd "$GAME_REPO" && git rev-parse HEAD)
CLIENT_VERSION=$(cd "$GAME_REPO" && git show -s --format=%s HEAD | grep -oP '^\d(?=\|)')
COMMIT_DATE=$(cd "$GAME_REPO" && git show -s --format=%ci HEAD)

# Add all files in the output directory
git add -A

# Commit the changes
git commit -m "$CLIENT_VERSION ($COMMIT_DATE)" || {
    echo "No changes to commit"
    exit 0
}

# Push the changes to main
git push origin main

echo "Changes committed and pushed to main branch."
