# GitHub Repository Setup Instructions

## Step 1: Create Repository on GitHub

1. Go to https://github.com/organizations/blockdag-network-labs/repositories/new
   (Or navigate: blockdag-network-labs → Repositories → New)

2. Repository settings:
   - **Name**: `blockdag-monitoring-dashboard` (or your preferred name)
   - **Description**: "Grafana-style monitoring dashboard for BlockDAG core nodes with mock Prometheus metrics"
   - **Visibility**: Public (recommended) or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. Click "Create repository"

## Step 2: Connect and Push Code

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Volumes/Vault/Work/the backer upper /core mon fe"

# Add the remote (replace YOUR-REPO-NAME with actual repo name)
git remote add origin https://github.com/blockdag-network-labs/YOUR-REPO-NAME.git

# Or if using SSH:
# git remote add origin git@github.com:blockdag-network-labs/YOUR-REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import the repository: `blockdag-network-labs/YOUR-REPO-NAME`
4. Vercel will auto-detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"
6. Your dashboard will be live in ~2 minutes!

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd "/Volumes/Vault/Work/the backer upper /core mon fe"
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: blockdag-monitoring-dashboard
# - Directory: ./
# - Override settings? No
```

## Step 4: Configure Automatic Deployments

Vercel will automatically:
- Deploy on every push to `main` branch
- Run tests before building (configured in package.json)
- Create preview deployments for pull requests
- Provide HTTPS and custom domain support

## Repository is Ready!

The code is already committed and ready to push. Just follow the steps above.

