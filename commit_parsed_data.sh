#!/bin/bash

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

# Check if main branch exists locally
if git show-ref --quiet refs/heads/main; then
    git checkout main
else
    # If main doesn't exist locally, create it tracking origin/main
    git checkout -b main origin/main
fi

# Pull the latest changes
git pull origin main

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

# Update main branch with the changes from the new branch
git checkout main
git merge --no-ff $branch_name -m "Merge branch '$branch_name' into main"
git push origin main

echo "Main branch updated with changes from $branch_name"
