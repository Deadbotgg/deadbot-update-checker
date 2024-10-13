#!/bin/bash

cd /app/repo

# Fetch changes from the remote repository
git fetch

# Check if there are any changes
if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
    echo "Changes detected. Pulling updates and parsing data..."
    git pull
    /bin/bash /app/pull_and_parse.sh
else
    echo "No changes detected."
fi

# Keep the container running
tail -f /dev/null
