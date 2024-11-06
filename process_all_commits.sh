#!/bin/bash

set -e

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set."
    exit 1
fi

# Function to delete all remote branches except main
delete_all_branches() {
    echo "Deleting all branches from deadlock-data repo..."
    cd /output
    git fetch origin
    # Delete all remote branches except main
    git branch -r | grep -v 'main$' | sed 's/origin\///' | while read branch; do
        git push origin --delete "$branch"
    done
    # Reset to main branch
    git checkout main
    git pull origin main
    cd /app
}

# Function to process a single commit
process_commit() {
    local commit_hash=$1
    local commit_date=$(git show -s --format=%ci $commit_hash)
    local branch_name=$(echo $commit_date | sed 's/ /-/g' | sed 's/:/-/g')
    
    echo "Processing commit $commit_hash from date $commit_date"
    
    # Checkout the specific commit
    git checkout $commit_hash
    
    # Run the parsing script
    bun run index.ts
    
    # Change to output directory and commit changes
    cd /output
    
    # Create and checkout new branch
    git checkout -b $branch_name
    
    # Add and commit changes
    git add .
    git commit -m "Parsed data from game commit $commit_hash ($commit_date)"
    
    # Push the new branch
    git push -u origin $branch_name
    
    # Merge to main
    git checkout main
    git merge --no-ff $branch_name -m "Merge branch '$branch_name' into main"
    git push origin main
    
    # Return to app directory for next iteration
    cd /app
}

# Main script execution

echo "Starting full processing of all commits..."

# First, delete all existing branches
delete_all_branches

# Get all commits in reverse chronological order
commits=$(git log --reverse --format="%H")

# Process each commit
for commit in $commits; do
    process_commit $commit
done

