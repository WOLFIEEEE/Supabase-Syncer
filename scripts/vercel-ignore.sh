#!/bin/bash

# Vercel Ignore Build Step Script
# This script determines if Vercel should build based on changed files
# Exit 1 = Build, Exit 0 = Skip build

echo "🔍 Checking if frontend rebuild is needed..."

# Get the list of changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD)

echo "📁 Changed files:"
echo "$CHANGED_FILES"

# Check if only server files changed
SERVER_ONLY=true
FRONTEND_CHANGED=false

for file in $CHANGED_FILES; do
  # Skip if file is in server directory
  if [[ $file == server/* ]]; then
    echo "  ⏭️  Server file: $file"
    continue
  fi
  
  # Skip markdown files (docs only)
  if [[ $file == *.md ]] && [[ $file != "README.md" ]]; then
    echo "  ⏭️  Docs file: $file"
    continue
  fi
  
  # Skip Coolify config files
  if [[ $file == coolify.json ]] || [[ $file == server/coolify.json ]]; then
    echo "  ⏭️  Coolify config: $file"
    continue
  fi
  
  # Skip Docker files for backend
  if [[ $file == server/Dockerfile ]] || [[ $file == docker-compose*.yaml ]] || [[ $file == docker-compose*.yml ]]; then
    echo "  ⏭️  Docker file: $file"
    continue
  fi
  
  # This file affects frontend
  echo "  ✅ Frontend file: $file"
  SERVER_ONLY=false
  FRONTEND_CHANGED=true
done

# Decision
if [ "$FRONTEND_CHANGED" = true ]; then
  echo ""
  echo "🚀 Frontend changes detected - proceeding with build"
  exit 1  # Build
else
  echo ""
  echo "⏭️  Only server/docs changes - skipping frontend build"
  exit 0  # Skip
fi
