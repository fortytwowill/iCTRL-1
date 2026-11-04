#!/bin/bash
set -e

echo "🚀 Starting iCTRL local CI pipeline..."

echo "📦 Installing dependencies..."
npm install --silent

echo "🔍 Running linter..."
npm run lint

echo "🧪 Running typecheck..."
npm run typecheck

echo "🧪 Running tests..."
npx vitest run --reporter=basic

echo "🏗️ Building application..."
npm run build

echo "🗄️ Pushing database schema (30s timeout — committed config targets Postgres, skip if unreachable)..."
rm -f ictl-dev.db
if ! timeout 30 npx drizzle-kit push --config drizzle.config.ts > /dev/null 2>&1; then
  echo "⚠️  DB push skipped (Postgres unreachable). Server uses SQLite fallback."
fi

echo "🏥 Running smoke test..."
npx tsx server/index.ts &
SERVER_PID=$!
sleep 3
if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
 echo "✅ Smoke test passed"
 kill $SERVER_PID 2>/dev/null || true
 exit 0
else
 echo "❌ Smoke test failed"
 kill $SERVER_PID 2>/dev/null || true
 exit 1
fi