# 🚀 Deploy CutPilot to Vercel

## Quick Deploy Steps

### 1. Prepare Your Project

**Install Vercel CLI:**

```bash
npm install -g vercel
```

**Login to Vercel:**

```bash
vercel login
```

### 2. Build Test (Optional but Recommended)

```bash
npm run build
```

Make sure build succeeds without errors.

### 3. Deploy to Vercel

**First-time deployment:**

```bash
vercel
```

Follow the prompts:

- Set up and deploy? `Y`
- Which scope? (Choose your account)
- Link to existing project? `N`
- Project name? `cutpilot-ui` (or your choice)
- Directory? `./` (press Enter)
- Override settings? `N`

**Production deployment:**

```bash
vercel --prod
```

### 4. Set Environment Variables

**In Vercel Dashboard:**

1. Go to your project: https://vercel.com/dashboard
2. Click on your project (cutpilot-ui)
3. Go to **Settings** → **Environment Variables**
4. Add the following:

| Name             | Value                 | Environment                      |
| ---------------- | --------------------- | -------------------------------- |
| `GEMINI_API_KEY` | `your_gemini_api_key` | Production, Preview, Development |

**Or via CLI:**

```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development (all)
```

### 5. Redeploy After Adding Env Variables

```bash
vercel --prod
```

---

## ⚠️ Important Limitations

**CutPilot on Vercel has constraints:**

### **Video Processing Won't Work** ❌

- FFmpeg requires filesystem access
- Serverless functions have 10-60s timeout
- Video processing takes longer
- Large file uploads not supported

### **What WILL Work** ✅

- ✅ UI and interface
- ✅ Video upload (to localStorage)
- ✅ AI plan generation (Gemini API)
- ✅ Operation planning
- ✅ Timeline visualization
- ✅ Draft management
- ✅ Asset library

### **What WON'T Work** ❌

- ❌ Video rendering
- ❌ FFmpeg operations
- ❌ Export functionality
- ❌ Platform format conversion

---

## 🎯 Recommended Deployment Strategy

### **For Demo/UI Preview** → Vercel ✅

Perfect for showing interface and AI capabilities.

### **For Full Functionality** → Use Alternative:

#### **Option A: Railway** (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Advantages:**

- ✅ Supports FFmpeg
- ✅ Long-running processes
- ✅ File system access
- ✅ Larger file uploads

**Setup:**

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Add environment variable: `GEMINI_API_KEY`
5. Deploy

#### **Option B: Render**

```bash
# Create render.yaml in root:
```

```yaml
services:
  - type: web
    name: cutpilot
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: GEMINI_API_KEY
        sync: false
```

**Deploy:**

1. Go to https://render.com
2. New Web Service → Connect GitHub
3. Add environment variables
4. Deploy

#### **Option C: DigitalOcean App Platform**

1. Go to https://cloud.digitalocean.com/apps
2. Create App → GitHub repo
3. Configure:
   - Build: `npm run build`
   - Run: `npm start`
   - Environment: Add `GEMINI_API_KEY`
4. Deploy

---

## 📦 Vercel Deployment Configuration

**Create `vercel.json` in root:**

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://cutpilot.vercel.app"
    }
  }
}
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

---

## 🔍 Troubleshooting Vercel Deployment

### Build Errors

**Error: "Module not found"**

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**Error: "FFmpeg not found"**

- Expected on Vercel (FFmpeg not available)
- Switch to Railway/Render for video processing

### Environment Variables Not Working

**Check:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure `GEMINI_API_KEY` is set for all environments
3. Redeploy after adding: `vercel --prod`

### API Routes Timing Out

**Increase timeout (Pro plan only):**

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

**Or split API to separate service:**

- Deploy frontend on Vercel
- Deploy API on Railway/Render
- Update API URLs in frontend

---

## 🎬 Quick Demo Deployment

**For Hackathon/Demo (Vercel is fine):**

1. **Deploy:**

   ```bash
   vercel --prod
   ```

2. **Share URL:**

   ```
   https://cutpilot-ui.vercel.app
   ```

3. **Demo with limitations noted:**
   - "UI preview - full rendering requires dedicated server"
   - Show AI plan generation
   - Show interface features
   - Explain video processing needs dedicated hosting

---

## 🌐 Custom Domain (Optional)

**Add custom domain in Vercel:**

1. Go to Project → Settings → Domains
2. Add domain: `cutpilot.yourdomain.com`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## 📊 Monitor Deployment

**Check deployment status:**

```bash
vercel ls
```

**View logs:**

```bash
vercel logs
```

**Check build logs:**

- Vercel Dashboard → Deployments → Click deployment → Build Logs

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] `npm run build` succeeds locally
- [ ] Environment variables configured
- [ ] `.env.local` NOT committed (in .gitignore)
- [ ] API endpoints tested locally
- [ ] README.md updated with deployment URL
- [ ] Known limitations documented

**After deployment:**

- [ ] Test on deployed URL
- [ ] Check all pages load
- [ ] Test API endpoints
- [ ] Verify environment variables work
- [ ] Test on mobile/tablet
- [ ] Check browser console for errors

---

## 🎯 Summary

**Vercel Deployment:**

```bash
# 1. Install CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add env vars
vercel env add GEMINI_API_KEY

# 5. Redeploy
vercel --prod
```

**Your app will be live at:**

```
https://cutpilot-ui-username.vercel.app
```

**For full video processing, use Railway instead:**

```bash
npm install -g @railway/cli
railway login
railway up
```

---

**Need help? Check Vercel docs:** https://vercel.com/docs
