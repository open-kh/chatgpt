sudo git pull origin main-v2
rm -rf .next && pnpm build
sh pm2.sh