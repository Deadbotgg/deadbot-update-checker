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

# Create a new branch with today's date
branch_name=$(date +"%Y-%m-%d-%H-%M")
git checkout -b $branch_name

# Add all files in the output directory
git add .

# Commit the changes
git commit -m "Update parsed data for $branch_name"

# Push the new branch to the remote repository
git push -u origin $branch_name

echo "Parsed data committed and pushed to branch $branch_name"

# Checkout main branch
git fetch origin main
git checkout -B main origin/main

# Merge the new branch into main, allowing unrelated histories
git merge --allow-unrelated-histories --no-ff $branch_name -m "Merge branch '$branch_name' into main"

# Push the updated main branch
git push origin main

echo "Main branch updated with changes from $branch_name"
