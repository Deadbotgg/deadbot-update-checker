#!/bin/bash

# Change to the app directory
cd /app

# Discard any local changes
git reset --hard

# Pull the latest updates
git pull

# Run index.ts using Bun
bun run index.ts

echo "Parsing complete."

# Run the commit_parsed_data.sh script
./commit_parsed_data.sh

echo "Parsed data committed and pushed to new branch, and main branch updated."
