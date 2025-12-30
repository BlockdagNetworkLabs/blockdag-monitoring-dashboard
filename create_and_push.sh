#!/bin/bash
set -e

echo "🚀 BlockDAG Monitoring Dashboard - GitHub Setup"
echo "================================================"
echo ""

# Check if organization exists
echo "Checking for blockdag-network-labs organization..."
ORG_EXISTS=$(gh api orgs/blockdag-network-labs 2>/dev/null && echo "yes" || echo "no")

if [ "$ORG_EXISTS" = "no" ]; then
    echo ""
    echo "⚠️  Organization 'blockdag-network-labs' not found."
    echo ""
    echo "Options:"
    echo "1. Create the organization first at: https://github.com/organizations/new"
    echo "2. Create repo under your personal account (ZombieDuckling) and transfer later"
    echo "3. Use an existing organization"
    echo ""
    read -p "Choose option (1/2/3): " OPTION
    
    case $OPTION in
        1)
            echo ""
            echo "Please create the organization at: https://github.com/organizations/new"
            echo "Then run this script again."
            exit 0
            ;;
        2)
            REPO_OWNER="ZombieDuckling"
            echo "Creating under personal account: $REPO_OWNER"
            ;;
        3)
            echo ""
            echo "Your organizations:"
            gh api user/orgs --jq '.[].login' | nl
            echo ""
            read -p "Enter organization name: " REPO_OWNER
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
else
    REPO_OWNER="blockdag-network-labs"
    echo "✅ Organization found: $REPO_OWNER"
fi

REPO_NAME="blockdag-monitoring-dashboard"

echo ""
echo "Creating repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Remove existing remote if any
git remote remove origin 2>/dev/null || true

# Create and push
gh repo create "$REPO_OWNER/$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --description="Grafana-style monitoring dashboard for BlockDAG core nodes with mock Prometheus metrics" \
    --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""
echo "📦 Repository URL: https://github.com/$REPO_OWNER/$REPO_NAME"
echo ""
echo "🌐 Next: Deploy to Vercel"
echo "1. Go to https://vercel.com"
echo "2. Import repository: $REPO_OWNER/$REPO_NAME"
echo "3. Click Deploy"
echo ""
echo "Your dashboard will be live in ~2 minutes! 🎉"
