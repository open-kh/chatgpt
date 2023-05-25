#!/bin/sh

# pm2 flush
pm2 kill
#pm2 delete all

COUNT=5
for i in $(seq 1 $COUNT)
do
  PORT=300$i pm2 --wait-ready --listen-timeout 1000 --cron-restart="*/1$i * * * *" --name vm-bot-$i start yarn -- start
  # pm2 scale vm-bot-$i +3
done
# PORT=3001 pm2 --wait-ready --listen-timeout 2000 --cron-restart="*/25 * * * *" --name vm-bot start yarn -- start
# pm2 scale vm-bot +5

pm2 save
