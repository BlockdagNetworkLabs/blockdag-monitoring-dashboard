# Push to GitHub - Quick Guide

## Option 1: Create Organization First (Recommended)

If `blockdag-network-labs` organization doesn't exist yet:

1. **Create the organization:**
   - Go to https://github.com/organizations/new
   - Organization name: `blockdag-network-labs`
   - Choose plan (Free is fine)
   - Complete setup

2. **Then run:**
   ```bash
   cd "/Volumes/Vault/Work/the backer upper /core mon fe"
   gh repo create blockdag-network-labs/blockdag-monitoring-dashboard \
     --public \
     --source=. \
     --remote=origin \
     --description="Grafana-style monitoring dashboard for BlockDAG core nodes" \
     --push
   ```

## Option 2: Create Under Your Personal Account First

If you want to create it now and transfer later:

```bash
cd "/Volumes/Vault/Work/the backer upper /core mon fe"

# Create under your personal account
gh repo create blockdag-monitoring-dashboard \
  --public \
  --source=. \
  --remote=origin \
  --description="Grafana-style monitoring dashboard for BlockDAG core nodes" \
  --push

# Later, transfer to organization:
# Go to repo Settings → Transfer ownership → blockdag-network-labs
```

## Option 3: Manual Setup

1. **Create repository on GitHub:**
   - Go to https://github.com/organizations/blockdag-network-labs/repositories/new
   - Name: `blockdag-monitoring-dashboard`
   - Description: "Grafana-style monitoring dashboard for BlockDAG core nodes"
   - Public
   - **Don't** initialize with README

2. **Push code:**
   ```bash
   cd "/Volumes/Vault/Work/the backer upper /core mon fe"
   git remote add origin https://github.com/blockdag-network-labs/blockdag-monitoring-dashboard.git
   git branch -M main
   git push -u origin main
   ```

## After Pushing - Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import: `blockdag-network-labs/blockdag-monitoring-dashboard`
5. Click "Deploy"
6. Done! 🎉

Your dashboard will be live at: `https://blockdag-monitoring-dashboard.vercel.app`

