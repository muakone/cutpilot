# Hosting & Production Deployment Guide

## Overview

CutPilot is currently configured for **local development and hackathon demos**. Deploying to production requires several infrastructure changes.

---

## 🚫 Current Blockers for Production Hosting

### 1. **FFmpeg Server-Side Processing** ⚠️ CRITICAL

**Problem:**

- FFmpeg runs on the **backend (Node.js)** and requires server-side binaries
- Cannot run in browser-only environments like Vercel, Netlify (serverless functions have size/timeout limits)

**Solutions:**

- **Option A: Dedicated Server** (VPS like DigitalOcean, AWS EC2, Hetzner)
  - Install FFmpeg on server
  - Run Next.js in Node.js mode (not serverless)
  - Handle long-running video processing tasks
- **Option B: Separate Processing Service**
  - Deploy frontend to Vercel/Netlify
  - Deploy backend API to separate service (Railway, Render, Fly.io)
  - Use queue system (Bull, BullMQ) for background jobs
- **Option C: Cloud Video Processing**
  - Use services like AWS MediaConvert, Cloudinary, Mux
  - More expensive but fully managed

**Recommended for Hackathon:** Option A (simple VPS)

---

### 2. **File Storage & Uploads** 📁

**Problem:**

- Currently saves to `/public/uploads/` (local filesystem)
- Serverless platforms have **ephemeral filesystems** (files disappear)
- No persistence across deployments

**Solutions:**

- **S3-compatible storage** (AWS S3, Cloudflare R2, DigitalOcean Spaces)
- **Process**: Upload → S3 → Get URL → FFmpeg downloads → Process → Upload result → Return URL
- Use `multer-s3` or similar for direct S3 uploads
- Pre-signed URLs for secure direct uploads

**localStorage Note:**

- ✅ **Fine for hackathon demo** (stores small metadata, uploaded image base64)
- ❌ **NOT for production** (5-10MB limit, browser-specific, can't share across devices)
- Replace with: Database (PostgreSQL, MongoDB) + S3 for files

---

### 3. **API Key Security** 🔐

**Problem:**

- Gemini API key in environment variables
- Current setup exposes key in serverless logs

**Solutions:**

- Use secret management (AWS Secrets Manager, Doppler, Infisical)
- Rotate keys regularly
- Implement rate limiting per user
- Add API key cost monitoring alerts

---

### 4. **Long-Running Processes & Timeouts** ⏱️

**Problem:**

- Video rendering can take **minutes to hours**
- Vercel/Netlify serverless functions: 10-60 second limit
- HTTP requests timeout

**Solutions:**

- **Background job queue** (Redis + Bull, Quirrel, Inngest)
- Process flow:
  1. User uploads → Job created → Return job ID immediately
  2. Worker processes video in background
  3. Frontend polls for status or uses WebSocket
  4. Notify user when complete (webhook, email, push notification)

**Libraries:**

- Bull/BullMQ (Redis-based queue)
- Inngest (serverless background jobs)
- Socket.io (real-time status updates)

---

### 5. **Database (Currently None)** 🗄️

**Problem:**

- No user accounts, no project persistence
- Everything in localStorage (temporary)

**Solutions:**

- Add database: **PostgreSQL** (Supabase, Railway), **MongoDB** (MongoDB Atlas)
- Schema:
  ```sql
  users (id, email, created_at)
  projects (id, user_id, name, video_url, status, created_at)
  edit_plans (id, project_id, plan_data, draft_number)
  rendered_videos (id, project_id, output_url, render_time)
  ```
- Use Prisma ORM (already have `prisma.config.ts`)

---

### 6. **Video File Size Limits** 📦

**Problem:**

- Large video uploads (100MB+) can:
  - Timeout during upload
  - Consume too much memory
  - Take forever to process

**Solutions:**

- **File size limits**: 100-500MB max
- **Chunked uploads**: Split large files (use `tus` protocol)
- **Video compression**: Pre-compress on client before upload
- **Streaming processing**: Process video in chunks (not all at once)

---

## 📋 Production Deployment Checklist

### Infrastructure Setup

- [ ] Choose hosting platform:
  - **VPS**: DigitalOcean ($6/mo), Hetzner ($4/mo), AWS EC2
  - **Backend Service**: Railway ($5/mo), Render, Fly.io
  - **Frontend**: Vercel (free), Netlify (free)
- [ ] Install FFmpeg on server (`apt-get install ffmpeg` or Docker image)
- [ ] Set up S3-compatible storage (Cloudflare R2 is cheapest)
- [ ] Configure environment variables in hosting dashboard
- [ ] Set up domain (Cloudflare, Namecheap)

### Code Changes Required

- [ ] Replace local file storage with S3

  ```typescript
  // Before
  fs.writeFileSync("/public/uploads/video.mp4", buffer);

  // After
  await s3.upload({ Bucket: "cutpilot", Key: "video.mp4", Body: buffer });
  ```

- [ ] Add job queue for rendering
- [ ] Implement WebSocket or polling for progress
- [ ] Add user authentication (NextAuth.js, Clerk, Supabase Auth)
- [ ] Add database migrations (Prisma)
- [ ] Replace localStorage with database queries
- [ ] Add rate limiting (Upstash Redis + ratelimit)

### Security

- [ ] Add CORS configuration
- [ ] Implement file upload validation (type, size, malware scan)
- [ ] Add rate limiting (max 5 videos/hour per user)
- [ ] Secure API routes with authentication middleware
- [ ] Add input sanitization for user instructions
- [ ] Enable HTTPS only
- [ ] Add Content Security Policy headers

### Performance

- [ ] Add video compression on upload
- [ ] Implement CDN for processed videos (Cloudflare CDN)
- [ ] Add Redis caching for analysis results
- [ ] Optimize FFmpeg encoding settings for speed
- [ ] Add background job monitoring (BullMQ Dashboard)

### Monitoring & Observability

- [ ] Add error tracking (Sentry, Axiom)
- [ ] Add logging (Datadog, Better Stack)
- [ ] Add uptime monitoring (UptimeRobot, Better Uptime)
- [ ] Add cost alerts (AWS Billing, CloudWatch)
- [ ] Track Gemini API usage & costs

---

## 🚀 Quick Hackathon Deployment (Easiest Path)

### Option 1: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add environment variables in Railway dashboard
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=models/gemini-2.5-flash

# 5. Deploy
railway up

# 6. Railway automatically:
# - Detects Next.js
# - Installs FFmpeg
# - Provides persistent storage volume
# - Gives you a public URL
```

**Cost:** ~$5-10/month (includes 512MB RAM, 1GB storage, FFmpeg)

### Option 2: DigitalOcean App Platform

```bash
# 1. Create account at digitalocean.com
# 2. Connect GitHub repo
# 3. Choose "Web Service" (not static site)
# 4. Add buildpack for FFmpeg
# 5. Add environment variables
# 6. Deploy

# Add to package.json:
"buildpacks": ["heroku/nodejs", "https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git"]
```

**Cost:** $5/month (basic plan)

### Option 3: Docker + Any VPS

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Deploy to any VPS (DigitalOcean, Hetzner, etc.)
docker build -t cutpilot .
docker run -p 3000:3000 -e GEMINI_API_KEY=xxx cutpilot
```

**Cost:** $4-6/month for VPS

---

## ⚠️ localStorage - Is it OK for Production?

### For Hackathon Demo: ✅ YES, it's FINE!

**Why it works for demo:**

- ✅ No backend database setup needed
- ✅ Works offline
- ✅ Fast (no network latency)
- ✅ Good for single-user testing
- ✅ Simple to implement

**What you're storing:**

- ✅ Uploaded images (as base64) - OK for small images
- ✅ Edit plans (JSON) - OK, small data
- ✅ User preferences - OK
- ✅ Project metadata - OK

### For Production: ❌ NO, use a database

**Problems:**

- ❌ 5-10MB limit per domain (hit limit fast with base64 images)
- ❌ Data doesn't sync across devices/browsers
- ❌ Cleared when user clears browser data
- ❌ Can't share projects with others
- ❌ No backup/recovery
- ❌ Security risks (anyone with browser access can read/modify)

**What to replace with:**

```typescript
// Before (localStorage)
localStorage.setItem("cutpilot_project", JSON.stringify(data));

// After (database)
await prisma.project.create({
  data: { userId: user.id, name: "My Project", planData: data },
});
```

---

## 🎯 Recommended Production Stack

```
Frontend:
├── Next.js (Vercel) - UI/Pages
├── Tailwind CSS - Styling
└── WebSocket client - Real-time updates

Backend:
├── Next.js API Routes (Railway/Render) - Business logic
├── FFmpeg - Video processing
├── Bull + Redis - Job queue
└── S3/R2 - File storage

Database:
├── PostgreSQL (Supabase/Railway) - Metadata
└── Prisma ORM - Database access

Auth:
└── Clerk/NextAuth - User authentication

Infrastructure:
├── Cloudflare CDN - Video delivery
├── Upstash Redis - Caching + Rate limiting
└── Sentry - Error tracking
```

**Total Monthly Cost:** ~$20-40 for moderate usage (100 users, 500 videos/month)

---

## 🏁 For Your Hackathon

**Keep localStorage - it works!** Just add this warning in your UI:

```tsx
<div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
  ⚠️ Demo Mode: Projects stored locally in browser. Clear browser data = lose
  projects.
</div>
```

**Deployment Path:**

1. Deploy to **Railway** (handles FFmpeg automatically)
2. Set environment variable: `GEMINI_API_KEY`
3. Deploy in 5 minutes
4. Get public URL
5. Demo ready! 🎉

**Post-Hackathon (if continuing):**

1. Add Supabase (auth + database)
2. Add Cloudflare R2 (file storage)
3. Replace localStorage with DB queries
4. Add user accounts
5. Launch! 🚀
