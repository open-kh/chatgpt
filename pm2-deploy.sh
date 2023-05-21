#!/bin/sh

COUNT=15
for i in $(seq 1 $COUNT)
do
  PORT=300$i pm2 start yarn --name vm-bot -- start #--max-memory-restart 100M
done
pm2 save
