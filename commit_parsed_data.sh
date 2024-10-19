#!/bin/bash

# Ensure we're in the correct directory
cd /output

git init 
git remote add origin git@github.com:Deadbotgg/deadlock-data.git
git fetch origin

# Create a new branch with today's date
branch_name=$(date +"%Y-%m-%d-%H-%M")
git checkout -b $branch_name

# Add all files in the output directory fron .env
git add .

# Commit the changes
git commit -m "Update parsed data for $branch_name"

# Push the new branch to the remote repository
git push -u origin $branch_name

echo "Parsed data committed and pushed to branch $branch_name"
