#!/bin/sh

COUNT=3
for i in $(seq 1 $COUNT)
do
  PORT=300$i pm2 start yarn --name vm-bot -- start #--max-memory-restart 150M
done
pm2 save