#!/bin/bash

cd /app/repo

# Fetch the latest changes from the remote repository
git fetch origin

# Check if the local branch is behind the remote branch
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo "New changes detected, pulling and running the script."
    git pull origin main
   
    # Run the script
        # Install any new dependencies using Bun
    bun install --frozen-lockfile

    # Stop the current running Bun app (optional, if needed)
    pkill -f 'bun run dev'

    # Start the Bun app
    bun run dev &
else
    echo "No new changes."
fi