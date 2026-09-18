#!/bin/sh
set -e

echo "Entrypoint: waiting for DB to be ready..."
# simple wait loop for Postgres
RETRIES=20
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-its_user}" >/dev/null 2>&1 || [ $RETRIES -le 0 ]; do
  echo "Waiting for postgres... ($RETRIES)"
  RETRIES=$((RETRIES-1))
  sleep 1
done

if [ "$NODE_ENV" != "production" ]; then
  echo "Running DB migrations..."
  npm run migrate || true
  echo "Running DB seeds..."
  npm run seed || true
fi

echo "Starting server"
exec node src/app.js
