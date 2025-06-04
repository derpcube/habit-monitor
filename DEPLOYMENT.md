# 🚀 Deployment Guide - Habit Monitor

## **Option 1: Vercel (Recommended) - FREE**

Vercel is the best choice for Next.js apps with excellent free tier.

### **Quick Deploy Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/habit-monitor.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up with GitHub
   - Click "New Project" and import your GitHub repo
   - Vercel will auto-detect it's a Next.js app

3. **Set Environment Variables in Vercel Dashboard:**
   ```
   DATABASE_URL = your_postgresql_connection_string
   NEXTAUTH_URL = https://your-app-name.vercel.app
   NEXTAUTH_SECRET = generate_a_secure_random_string
   ```

4. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

### **Database Options for Production:**

#### **A. Railway (FREE PostgreSQL)**
1. Go to [railway.app](https://railway.app)
2. Sign up and create new project
3. Add PostgreSQL database
4. Copy the connection string to Vercel environment variables

#### **B. Supabase (FREE PostgreSQL)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string to Vercel

#### **C. PlanetScale (FREE MySQL)**
1. Go to [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string

---

## **Option 2: Netlify - FREE**

1. **Build Settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

2. **Environment Variables:**
   Same as Vercel above

---

## **Option 3: Railway - FREE**

1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Add PostgreSQL service
4. Set environment variables

---

## **Environment Variables for Production:**

```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_URL="https://your-app-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters"
```

---

## **Mobile Support Setup**

### **PWA (Progressive Web App)**
Your app can be installed as a mobile app:

1. **Add to package.json:**
   ```json
   "dependencies": {
     "next-pwa": "^5.6.0"
   }
   ```

2. **Create next.config.js:**
   ```javascript
   const withPWA = require('next-pwa')({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development'
   })

   module.exports = withPWA({})
   ```

3. **Add manifest.json in public folder**
4. **Add service worker**

### **Mobile App Options:**
1. **Capacitor.js** - Turn web app into native mobile app
2. **React Native** - Separate mobile app sharing backend
3. **Ionic** - Hybrid mobile framework

---

## **Quick Mobile PWA Setup**

Add these files to make it installable on mobile:

**public/manifest.json:**
```json
{
  "name": "Habit Monitor",
  "short_name": "Habits",
  "description": "Track your daily habits",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Add to app/layout.tsx head:**
```jsx
<meta name="theme-color" content="#3B82F6" />
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Habit Monitor" />
```

---

## **Database Migration for Production**

When switching from SQLite to PostgreSQL:

1. **Update schema.prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate and push:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Create admin user in production:**
   - Use Prisma Studio or create a seed script

---

## **Post-Deployment Checklist**

- [ ] App loads correctly
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can create habits
- [ ] Can mark habits complete
- [ ] Analytics work properly
- [ ] Mobile responsive
- [ ] PWA installable (if implemented)

---

## **Free Tier Limitations**

**Vercel Free:**
- 100GB bandwidth/month
- 100 serverless function executions/day
- No custom domains on free tier

**Railway Free:**
- $5 free credits/month
- Enough for small personal apps

**Netlify Free:**
- 100GB bandwidth/month
- 300 build minutes/month

Choose Vercel for the best Next.js experience! 