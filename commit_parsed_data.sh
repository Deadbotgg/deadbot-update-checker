#!/bin/bash

set -e

# Ensure we're in the correct directory
cd /output

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set."
    exit 1
fi

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

# Get version info from version_info.json if it exists
if [ -f "version_info.json" ]; then
    CLIENT_VERSION=$(jq -r '.clientVersion' version_info.json)
    VERSION_DATE=$(jq -r '.versionDate' version_info.json)
    COMMIT_MESSAGE="$CLIENT_VERSION ($VERSION_DATE)"
else
    # Fallback to git commit info if version_info.json doesn't exist
    GAME_COMMIT=$(cd /app && git rev-parse HEAD)
    CLIENT_VERSION=$(cd /app && git show -s --format=%s HEAD | cut -d'|' -f1)
    COMMIT_DATE=$(cd /app && git show -s --format=%ci HEAD)
    COMMIT_MESSAGE="$CLIENT_VERSION ($COMMIT_DATE)"
fi

# Add all files in the output directory
git add -A

# Commit the changes
git commit -m "$COMMIT_MESSAGE" || {
    echo "No changes to commit"
    exit 0
}

# Push the changes to main
git push origin main

echo "Changes committed and pushed to main branch."
