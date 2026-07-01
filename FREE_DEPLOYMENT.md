# 🚀 Deployment Guide: Zero Budget ($0) Stack

This guide outlines how to host the **SalesBI Enterprise Platform** entirely for free using industry-standard cloud providers.

## 🏗️ The "Free Forever" Stack

| Component | Provider | Why? |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Best-in-class React hosting, global CDN, automatic SSL. |
| **Backend** | [Render](https://render.com) | Reliable free tier for Node.js services. |
| **Database** | [TiDB Cloud](https://tidbcloud.com) | Free-tier MySQL compatible database with 5GB+ storage. |

---

## 🛰️ Step 1: Database Setup (TiDB Cloud)

1. **Sign Up**: Create a free account at [TiDB Cloud](https://tidbcloud.com).
2. **Create Cluster**: Select the **"Serverless" (Free Tier)** cluster.
3. **Get Credentials**:
   - Go to "Connect" and choose "Standard Connection".
   - Note down: `Host`, `User`, `Password`, and `Port` (Usually 4000).
4. **Initialize Schema**:
   - Use the TiDB Web Console or a tool like MySQL Workbench.
   - Run the contents of `backend/sql/schema.sql`.

---

## ⚙️ Step 2: Backend Deployment (Render)

1. **Prepare Repository**: Push your code to GitHub (Private or Public).
2. **Connect to Render**:
   - Sign up at [Render.com](https://render.com).
   - Click **"New +"** -> **"Web Service"**.
   - Connect your GitHub repository.
3. **Configure Build Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. **Environment Variables**: Add these in the Render "Environment" tab:
   - `DB_HOST`: *Your TiDB Host*
   - `DB_USER`: *Your TiDB User*
   - `DB_PASS`: *Your TiDB Password*
   - `DB_NAME`: `salesbi_db`
   - `DB_PORT`: `4000`
   - `JWT_SECRET`: *Generate a random string*
   - `FRONTEND_URL`: *You will get this from Step 3*
5. **Note**: The free tier goes to "sleep" after 15 minutes of inactivity. The first request after a break may take 30-50 seconds to start the server.

---

## 🎨 Step 3: Frontend Deployment (Vercel)

1. **Connect to Vercel**:
   - Sign up at [Vercel.com](https://vercel.com).
   - Click **"Add New"** -> **"Project"**.
   - Import your GitHub repository.
2. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: *The URL Google gives you for your Render backend* (e.g., `https://salesbi-backend.onrender.com/api`)
4. **Deploy**: Click **"Deploy"**.

---

## 🛠️ Maintenance & Tips

- **Wake Up**: Since Render's free tier sleeps, you can use [Cron-job.org](https://cron-job.org) to ping your server every 14 minutes to keep it awake (optional).
- **Security**: Never commit your `.env` files to GitHub. Always use the provider's Environment Variable dashboard.
- **CORS Errors**: If you face CORS issues, ensure your Backend `FRONTEND_URL` matches the Vercel URL exactly (no trailing slash).

---

## 🏆 Alternative Stack: Oracle Cloud (Advanced)
If you are comfortable with SSH and Linux:
- **Oracle Cloud "Always Free"**: Gives you 4 OCPUs, 24GB RAM, and a real VM for $0.
- **Pros**: No "sleeping" servers, much more powerful.
- **Cons**: Requires a credit card for identity verification and registration can be difficult.

---
Guide prepared by **Antigravity AI** for **Mohamed Amine Nouioui**.
