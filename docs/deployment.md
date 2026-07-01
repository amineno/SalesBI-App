# Deployment Guide

This project is built for professional SaaS deployment. Follow these steps to go live.

## 1. Database (PlanetScale / Railway / Aiven)
1. Provision a managed MySQL instance.
2. Run `data/init.sql` using a client like MySQL Workbench or DBeaver.
3. Import the generated `data/seed.sql`.

## 2. Backend (Render / Railway / DigitalOcean)
1. Connect your GitHub repository to **Render**.
2. Set Environment Variables:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (pointing to your managed DB).
   - `PORT`: 5000.
3. Build Command: `npm install`.
4. Start Command: `node index.js`.

## 3. Frontend (Vercel / Netlify)
1. Connect your repository to **Vercel**.
2. Set Environment Variable:
   - `VITE_API_BASE`: URL of your deployed backend (e.g., `https://your-api.onrender.com/api`).
3. Root Directory: `frontend`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.

## 4. Power BI Service
1. In Power BI Desktop, Click **Publish**.
2. Select your Workspace.
3. Configure the **Data Gateway** or use **DirectQuery** if your DB provider supports it for real-time reporting.
4. Set up **Scheduled Refresh** for the Import model.
