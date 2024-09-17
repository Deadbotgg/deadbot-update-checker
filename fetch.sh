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
    /path/to/your/script.sh
else
    echo "No new changes."
fi