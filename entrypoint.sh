#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => { client.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "✅ Database is ready."
echo "🔄 Running database migrations..."
npx drizzle-kit push --force || echo "⚠️  Schema may already be up to date"

echo "🚀 Starting application on port $PORT..."
exec node dist/index.cjs
