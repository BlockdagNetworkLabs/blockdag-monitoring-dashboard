# Switch to Kryptonator Account and Push

## Step 1: Switch GitHub Account

Run this command to switch to the Kryptonator account:

```bash
gh auth login
```

Or if you have multiple accounts already configured:

```bash
gh auth switch
```

Then select the Kryptonator account.

## Step 2: Verify Account

Check that you're on the right account:

```bash
gh api user --jq '.login'
```

Should show: `Kryptonator` (or similar)

## Step 3: Create Repository and Push

Once authenticated as Kryptonator, run:

```bash
cd "/Volumes/Vault/Work/the backer upper /core mon fe"

# Create repo in blockdag-network-labs organization
gh repo create blockdag-network-labs/blockdag-monitoring-dashboard \
  --public \
  --source=. \
  --remote=origin \
  --description="Grafana-style monitoring dashboard for BlockDAG core nodes with mock Prometheus metrics" \
  --push
```

## Alternative: Manual Setup

If the organization name is different, you can:

1. **Check organization name:**
   ```bash
   gh api user/orgs --jq '.[].login'
   ```

2. **Create repo manually:**
   - Go to https://github.com/organizations/YOUR-ORG/repositories/new
   - Name: `blockdag-monitoring-dashboard`
   - Don't initialize with README
   - Then push:
   ```bash
   git remote add origin https://github.com/YOUR-ORG/blockdag-monitoring-dashboard.git
   git branch -M main
   git push -u origin main
   ```

## After Pushing - Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub (make sure you're signed in as Kryptonator)
3. Click "Add New Project"
4. Import: `blockdag-network-labs/blockdag-monitoring-dashboard`
5. Click "Deploy"

Done! 🎉

