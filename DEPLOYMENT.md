# Deployment Guide

This document provides instructions for deploying the BlockDAG Monitoring Dashboard to various hosting platforms.

## Recommended Hosting Options

### 1. **Vercel** (⭐ Recommended - Easiest)

**Why Vercel:**
- Zero-config deployment for Vite/React
- Automatic HTTPS
- Global CDN
- Free tier with generous limits
- Automatic deployments from Git
- Preview deployments for PRs
- Built-in analytics

**Deployment Steps:**

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

3. **Deploy via Web UI:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

4. **Deploy via CLI:**
   ```bash
   vercel
   ```

**Configuration:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

The `vercel.json` file is already configured for optimal settings.

---

### 2. **Netlify** (⭐ Great Alternative)

**Why Netlify:**
- Excellent for static sites
- Free tier with good limits
- Easy Git integration
- Form handling (if needed later)
- Split testing capabilities

**Deployment Steps:**

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Install Netlify CLI** (optional):
   ```bash
   npm i -g netlify-cli
   ```

3. **Deploy via Web UI:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Netlify will auto-detect settings from `netlify.toml`
   - Click "Deploy site"

4. **Deploy via CLI:**
   ```bash
   netlify deploy --prod
   ```

**Configuration:**
The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing support

---

### 3. **GitHub Pages** (Free, Simple)

**Why GitHub Pages:**
- Completely free
- Integrated with GitHub
- Good for open-source projects
- Simple setup

**Deployment Steps:**

1. **Enable GitHub Actions:**
   - The `.github/workflows/deploy.yml` file is already configured
   - Push your code to GitHub
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source

2. **Automatic Deployment:**
   - Every push to `main` branch triggers deployment
   - Tests run automatically before deployment
   - Build happens in GitHub Actions
   - Site deploys to `https://yourusername.github.io/repo-name`

3. **Update base path in `vite.config.ts`** if deploying to subdirectory:
   ```typescript
   base: '/repo-name/'
   ```

---

### 4. **Cloudflare Pages** (Fast & Free)

**Why Cloudflare Pages:**
- Free tier with unlimited bandwidth
- Fast global CDN
- Easy Git integration
- Built-in analytics

**Deployment Steps:**

1. **Push your code to GitHub/GitLab**

2. **Deploy via Web UI:**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Sign up/login
   - Click "Create a project"
   - Connect your Git repository
   - Build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Click "Save and Deploy"

---

### 5. **Railway** (Full-Stack Ready)

**Why Railway:**
- Good if you plan to add backend later
- Simple deployment
- Free tier available
- Good for prototypes

**Deployment Steps:**

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Environment variables configured (if any)
- [ ] Base path configured correctly for your hosting platform

## Environment Variables

If you need environment variables:

1. **Vercel/Netlify:** Set in dashboard under Project Settings → Environment Variables
2. **GitHub Pages:** Use GitHub Secrets in repository settings
3. **Cloudflare Pages:** Set in dashboard under Settings → Environment Variables

Access in code:
```typescript
import.meta.env.VITE_YOUR_VARIABLE
```

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS as instructed

### GitHub Pages
1. Go to repository Settings → Pages
2. Add custom domain
3. Update DNS records

## Performance Optimization

The build is already optimized with:
- Vite's production build optimizations
- Code splitting
- Tree shaking
- Minification

For additional optimization:
- Enable compression on your hosting platform
- Use CDN caching
- Enable HTTP/2

## Monitoring & Analytics

Consider adding:
- **Vercel Analytics** (built-in)
- **Google Analytics** (add to `index.html`)
- **Sentry** (error tracking)

## Troubleshooting

### Build Fails
- Check that all tests pass: `npm test`
- Verify Node.js version (18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Routing Issues (404 on refresh)
- Ensure SPA routing is configured (already done in config files)
- Check base path configuration

### Tests Fail in CI
- Ensure all dependencies are in `package.json`
- Check that test environment is properly configured
- Verify ResizeObserver polyfill is working

## Quick Deploy Commands

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# GitHub Pages (via Actions - automatic on push to main)

# Cloudflare Pages (via dashboard or CLI)
wrangler pages deploy dist
```

## Recommended Choice

**For most users: Vercel** - It's the easiest, fastest, and most developer-friendly option with excellent free tier and automatic deployments.

**For open-source projects: GitHub Pages** - Free, integrated, and perfect for showcasing your work.

**For maximum performance: Cloudflare Pages** - Fastest CDN and unlimited bandwidth on free tier.

