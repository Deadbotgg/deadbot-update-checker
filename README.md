# deadbot-update-checker

This project is designed to automatically check for updates in the Deadlock game files and process them.

## Features

- Automatically clones the GameTracking-Deadlock repository when an update is pushed
- Parses and processes game files
- Runs checks every 5 minutes using a cron job within the Docker container

## Setup and Running

1. Ensure you have Docker installed on your system.

2. Clone this repository:
   ```
   git clone https://github.com/deadbotgg/deadbot-update-checker.git
   cd deadbot-update-checker
   ```

3. Build the Docker image:
   ```
   docker build -t deadbot-update-checker .
   ```

4. Run the Docker container:
   ```
   docker run -d --name deadbot-checker deadbot-update-checker
   ```

## How it works

- The Dockerfile sets up an environment with Bun, Git, and cron.
- The `fetch.sh` script is responsible for checking for updates and processing files.
- A cron job is set up to run `fetch.sh` every 5 minutes.
- Logs from the cron job are written to `/var/log/cron.log` inside the container.

## Viewing logs

To view the logs from the cron job:

```
docker exec deadbot-checker cat /var/log/cron.log
```