#!/bin/bash

# Ship AI - Start Script
# Just double-click this file or run: ./start.sh

echo "🚀 Starting Ship AI..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Start the dev server
# Start the dev server and open specific Chrome profile
npm run dev -- --open --browser "google chrome" &
sleep 2
open -na "Google Chrome" --args --profile-directory="Default" "http://localhost:8080/site"

# The site will be available at http://localhost:8080/site
