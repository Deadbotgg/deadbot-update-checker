FROM ubuntu:latest

RUN apt-get update && \
    apt-get install -y git cron && \
    apt-get clean

WORKDIR /app

RUN git clone https://github.com/SteamDatabase/GameTracking-Deadlock.git /app/repo

COPY fetch.sh /app/fetch.sh

RUN chmod +x /app/fetch.sh

RUN echo "*/15 * * * * /app/pull_and_parse.sh >> /var/log/cron.log 2>&1" >> /etc/crontab
COPY pull_and_parse.sh /app/pull_and_parse.sh
RUN chmod +x /app/pull_and_parse.sh

CMD ["cron", "-f"]