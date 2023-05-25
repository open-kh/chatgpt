#!/bin/sh

pm2 kill

COUNT=15
for i in $(seq 1 $COUNT)
do
  PORT=300$i pm2 --max-memory-restart 85M --name vm-bot start yarn -- start
done

pm2 save
