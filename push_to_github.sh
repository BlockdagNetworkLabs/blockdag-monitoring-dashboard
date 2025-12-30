#!/bin/bash
# Script to push code to blockdag-network-labs GitHub organization

echo "🚀 BlockDAG Monitoring Dashboard - GitHub Setup"
echo ""
echo "Repository URL format: https://github.com/blockdag-network-labs/REPO-NAME"
echo ""
read -p "Enter your repository name: " REPO_NAME

if [ -z "$REPO_NAME" ]; then
    echo "❌ Repository name cannot be empty"
    exit 1
fi

echo ""
echo "Setting up remote..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/blockdag-network-labs/${REPO_NAME}.git"

echo ""
echo "Current branch:"
git branch --show-current

echo ""
echo "📦 Files ready to push:"
git status --short | head -10

echo ""
read -p "Push to GitHub now? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    git branch -M main
    git push -u origin main
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Import repository: blockdag-network-labs/${REPO_NAME}"
    echo "3. Deploy!"
else
    echo "Setup complete. Run 'git push -u origin main' when ready."
fi
