#!/bin/bash

# Set up logging
LOGFILE="/var/log/fetch.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "$(date): Starting fetch script"

cd /app/repo

# Fetch changes from the remote repository
git fetch

# Check if there are any changes
if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
    echo "$(date): Changes detected. Pulling updates and parsing data..."
    git pull
    /bin/bash /app/pull_and_parse.sh
else
    echo "$(date): No changes detected."
fi

echo "$(date): Fetch script completed"
