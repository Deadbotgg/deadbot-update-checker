#!/bin/bash

set -e

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set."
    exit 1
fi

# Check if game data repo path is provided
if [ -z "$1" ]; then
    echo "Error: Game data repository path not provided"
    echo "Usage: $0 /path/to/game/data/repo"
    exit 1
fi

GAME_REPO="$1"

# Function to clean working directory
clean_working_dir() {
    git reset --hard
    git clean -fd
    # Stash any pending changes
    git stash clear
    git stash -u
}

# Function to delete all remote branches except main
delete_all_branches() {
    echo "Deleting all branches from deadlock-data repo..."
    cd /output
    
    # Clean working directory first
    clean_working_dir
    
    git fetch origin
    # Delete all remote branches except main
    git branch -r | grep -v 'main$' | sed 's/origin\///' | while read branch; do
        git push origin --delete "$branch" || true
    done
    
    # Reset to main branch
    git fetch origin main
    git checkout main
    git reset --hard origin/main
    git clean -fd
    
    cd "$GAME_REPO"
}

# Function to process a single commit
process_commit() {
    local commit_hash=$1
    local commit_date=$(git show -s --format=%ci $commit_hash)
    local branch_name=$(echo $commit_date | sed 's/ /-/g' | sed 's/:/-/g')
    
    echo "Processing commit $commit_hash from date $commit_date"
    
    # Clean working directory before checkout
    clean_working_dir
    
    # Checkout the specific commit
    git checkout -f $commit_hash
    
    # Copy game data files to app directory
    echo "Copying game data files to app directory..."
    cp -r "$GAME_REPO"/* /app/data/
    
    cd /app
    
    # Run the parsing script
    echo "Running parser..."
    bun run index.ts || {
        echo "Error during parsing for commit $commit_hash"
        return 1
    }
    
    # Change to output directory and commit changes
    cd /output
    
    # Clean working directory before branch operations
    clean_working_dir
    
    # Make sure we're on main first
    git fetch origin main
    git checkout main
    git reset --hard origin/main
    
    # Create and checkout new branch
    git checkout -b $branch_name
    
    # Add and commit changes
    git add -A
    git commit -m "Parsed data from game commit $commit_hash ($commit_date)" || {
        echo "No changes to commit for $commit_hash"
        cd "$GAME_REPO"
        return 0
    }
    
    # Push the new branch
    git push -u origin $branch_name
    
    # Switch to main and merge
    git checkout main
    git reset --hard origin/main
    
    # Try to merge, but if it fails, just continue
    git merge --no-ff $branch_name -m "Merge branch '$branch_name' into main" || {
        echo "Merge failed for branch $branch_name, continuing..."
        git merge --abort
    }
    
    # Try to push main, but if it fails, just continue
    git push origin main || {
        echo "Push to main failed for branch $branch_name, continuing..."
    }
    
    # Return to game repo directory for next iteration
    cd "$GAME_REPO"
}

# Main script execution

echo "Starting full processing of all commits..."

# Verify game repo exists and is a git repository
if [ ! -d "$GAME_REPO/.git" ]; then
    echo "Error: $GAME_REPO is not a git repository"
    exit 1
fi

# Change to game repo directory
cd "$GAME_REPO"

# First, delete all existing branches
delete_all_branches

# Get all commits in reverse chronological order
commits=$(git log --reverse --format="%H")

# Process each commit
for commit in $commits; do
    process_commit $commit || {
        echo "Failed to process commit $commit, continuing with next..."
        continue
    }
done

echo "Processing complete. All commits have been processed and data pushed to respective branches."
