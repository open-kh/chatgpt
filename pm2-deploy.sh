#!/bin/sh

COUNT=10
for i in $(seq 1 $COUNT)
do
  PORT=300$i pm2 start yarn --name chatbot-vm -- start --max-memory-restart 100M
done