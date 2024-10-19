#!/bin/bash

# Ensure we're in the correct directory
cd /output

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set."
    exit 1
fi

# Clone the repository if it doesn't exist
if [ ! -d ".git" ]; then
    git clone "https://${GITHUB_TOKEN}@github.com/Deadbotgg/deadlock-data.git" .
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone the repository."
        exit 1
    fi
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

# Update main branch with the changes from the new branch
git fetch origin main
git checkout main
git merge --no-ff $branch_name -m "Merge branch '$branch_name' into main"
git push origin main

echo "Main branch updated with changes from $branch_name"
