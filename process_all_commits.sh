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

# Function to reset repo to empty state
reset_repo() {
    echo "Resetting repository to empty state..."
    cd /output
    
    # Delete all branches except main
    git fetch origin
    git branch -r | grep -v 'main$' | sed 's/origin\///' | while read branch; do
        git push origin --delete "$branch" || true
    done
    
    # Create new orphan branch (no history)
    git checkout --orphan temp_main
    
    # Remove all files
    rm -rf *
    
    # Create directory structure
    mkdir -p data/output/scripts
    
    # Create empty README to ensure we can commit
    echo "# Deadlock Data" > README.md
    echo "Generated game data repository" >> README.md
    
    # Create empty initial commit
    git add README.md
    git commit -m "Initial empty state"
    
    # Force push to main
    git push -f origin temp_main:main
    
    # Checkout main and reset to our new history
    git checkout main
    git reset --hard origin/main
    
    # Clean up temporary branch
    git branch -D temp_main
    
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
    
    echo "Processing commit $commit_hash"
    
    # Clean working directory before checkout
    clean_working_dir
    
    # Checkout the specific commit
    git checkout -f $commit_hash
    
    # Debug: Print the commit message
    echo "Debug: Commit message from git show:"
    git show -s --format=%s $commit_hash
    
    # Extract version from commit message
    VERSION=$(git show -s --format=%s $commit_hash | sed 's/ |.*$//')
    
    # Debug: Print extracted version
    echo "Debug: Extracted version: $VERSION"
    
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
    
    # Make sure we're on main
    git checkout main
    
    # Add and commit changes directly to main
    git add -A
    git commit -m "$VERSION" || {
        echo "No changes to commit for $commit_hash"
        cd "$GAME_REPO"
        return 0
    }
    
    # Push changes to main
    git push origin main
    
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

# First, reset repo to empty state
reset_repo

# Get all commits in reverse chronological order
commits=$(git log --reverse --format="%H")

# Process each commit
for commit in $commits; do
    process_commit $commit || {
        echo "Failed to process commit $commit, continuing with next..."
        continue
    }
done

echo "Processing complete. Repository history has been rebuilt from game commit history."
