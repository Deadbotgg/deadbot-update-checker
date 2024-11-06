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

# Function to copy game data files
copy_game_data() {
    echo "Setting up data directory..."
    # Create data directory if it doesn't exist
    mkdir -p /app/data
    
    echo "Copying .vdata files..."
    # Find and copy all .vdata files from game repo to app data directory
    find "$GAME_REPO/game/citadel" -name "*.vdata" -exec cp {} /app/data/ \;
    
    # List copied files for verification
    echo "Copied files:"
    ls -la /app/data/
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
    
    # Copy game data files
    copy_game_data
    
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
    
    # Return to game repo directory for next iteration
    cd "$GAME_REPO"
}

# Function to reset main branch with only our new commits
reset_main_branch() {
    echo "Resetting main branch to contain only our new commits..."
    cd /output
    
    # Create a temporary branch
    git checkout --orphan temp_main
    
    # Add all files
    git add -A
    
    # Create initial commit
    git commit -m "Initial commit - Reset main branch"
    
    # Force push to main
    git push -f origin temp_main:main
    
    # Checkout main and reset to our new history
    git checkout main
    git reset --hard origin/main
    
    # Clean up temporary branch
    git branch -D temp_main
    
    echo "Main branch has been reset successfully."
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

# Reset main branch to contain only our new commits
reset_main_branch

echo "Processing complete. All commits have been processed and branches have been created."
echo "Main branch has been reset to contain only the new commits."
