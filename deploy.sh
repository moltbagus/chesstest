#!/bin/bash
# Chessy Vercel Deployment Script

set -e

echo "🚀 Deploying Chessy to Vercel..."

echo "📦 Checking dependencies..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "🏗️ Building project..."
echo "📄 Static site - no build required"

echo "🚀 Deploying to Vercel...")
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your Chessy game is now live on Vercel!"
