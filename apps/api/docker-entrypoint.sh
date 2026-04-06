#!/bin/sh
set -e
cd /app/apps/api
npx prisma db push
exec node dist/index.js
