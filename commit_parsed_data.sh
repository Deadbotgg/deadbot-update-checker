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

# Create a backup of local changes
echo "Creating backup of local changes..."
mkdir -p ../backup
cp -R . ../backup/

# Reset to the latest state of the main branch
git reset --hard origin/main

# Copy back the local changes
echo "Restoring local changes..."
cp -R ../backup/* .

# Remove the backup
rm -rf ../backup

# Add all files
git add .

# Commit local changes
git commit -m "Local changes" || echo "No changes to commit"

# Create a new branch with today's date
branch_name=$(date +"%Y-%m-%d-%H-%M")
git checkout -b $branch_name

# Push the new branch to the remote repository
git push -u origin $branch_name

echo "Parsed data committed and pushed to branch $branch_name"

# Update main branch with the changes from the new branch
git checkout main
git merge --allow-unrelated-histories --no-ff $branch_name -m "Merge branch '$branch_name' into main"
git push origin main

echo "Main branch updated with changes from $branch_name"
