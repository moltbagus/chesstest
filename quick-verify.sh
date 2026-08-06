#!/bin/bash
# Quick verification of Chessy deployment

echo "🔍 Quick Verification of Chessy Deployment"
echo "=" * 50

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json missing"
    exit 1
fi

# Check if key files exist
for file in index.html css/style.css js/chess.js js/ai.js; do
    if [ ! -f "$file" ]; then
        echo "❌ $file missing"
        exit 1
    fi
    echo "✅ $file exists"
done

echo "
🎯 All files present - deployment ready!"
echo "🚀 Run 'vercel --prod' to deploy"
