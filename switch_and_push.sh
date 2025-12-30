#!/bin/bash
set -e

echo "🔄 Switching to Kryptonator GitHub Account"
echo "=========================================="
echo ""

# Check current account
CURRENT_USER=$(gh api user --jq '.login' 2>/dev/null || echo "unknown")
echo "Current GitHub user: $CURRENT_USER"
echo ""

if [ "$CURRENT_USER" != "Kryptonator" ] && [ "$CURRENT_USER" != "kryptonator" ]; then
    echo "⚠️  Not on Kryptonator account. Switching..."
    echo ""
    echo "Please authenticate as Kryptonator:"
    gh auth login
    
    # Verify switch
    NEW_USER=$(gh api user --jq '.login' 2>/dev/null)
    echo ""
    echo "Now authenticated as: $NEW_USER"
    echo ""
fi

# Check for blockdag-network-labs org
echo "Checking for blockdag-network-labs organization..."
ORG_EXISTS=$(gh api orgs/blockdag-network-labs 2>/dev/null && echo "yes" || echo "no")

if [ "$ORG_EXISTS" = "no" ]; then
    echo "⚠️  Organization not found. Checking available orgs..."
    echo ""
    echo "Your organizations:"
    gh api user/orgs --jq '.[].login' | nl
    echo ""
    read -p "Enter organization name (or press Enter for blockdag-network-labs): " ORG_NAME
    ORG_NAME=${ORG_NAME:-blockdag-network-labs}
else
    ORG_NAME="blockdag-network-labs"
    echo "✅ Organization found: $ORG_NAME"
fi

REPO_NAME="blockdag-monitoring-dashboard"

echo ""
echo "Creating repository: $ORG_NAME/$REPO_NAME"
echo ""

# Remove existing remote if any
git remote remove origin 2>/dev/null || true

# Create and push
gh repo create "$ORG_NAME/$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --description="Grafana-style monitoring dashboard for BlockDAG core nodes with mock Prometheus metrics" \
    --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""
echo "📦 Repository URL: https://github.com/$ORG_NAME/$REPO_NAME"
echo ""
echo "🌐 Next: Deploy to Vercel"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub (as Kryptonator)"
echo "3. Import repository: $ORG_NAME/$REPO_NAME"
echo "4. Click Deploy"
echo ""
echo "Your dashboard will be live in ~2 minutes! 🎉"
