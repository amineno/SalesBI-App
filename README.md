# SalesBI Enterprise Edition 🚀



SalesBI is a high-performance, enterprise-grade Sales Intelligence and Inventory Management platform. It leverages a modern tech stack (MySQL, Express, React, Node.js) to deliver real-time analytics, secure role-based access control, and a premium user experience tailored for high-growth businesses.

## 🔐 Administrator Access (Demo)

Use the following credentials to access the full administrative capabilities of the platform:

| Field | Credential |
| :--- | :--- |
| **Admin Email** | `nouiouidev404@dev.com` |
| **Password** | `Admin123/*` |
| **Role** | System Administrator |

---

## 🌟 Key Features

- **🛡️ Enterprise Security**: JWT-based authentication with Bcrypt hashing and production-ready middleware.
- **📊 Business Intelligence**: Dynamic dashboards with real-time sales trends, revenue analytics, and KPI tracking.
- **📦 Inventory Lifecycle Management**: Professional SKU tracking, low-stock automated alerts, and multi-category filtering.
- **👥 Role-Based Access Control (RBAC)**: Granular permissions for Administrators, Sales Managers, and Accountants.
- **🎨 Premium UI/UX**: Advanced glassmorphism design, adaptive dark/light modes, and fluid responsive layouts.
- **🚀 Scalable Infrastructure**: Optimized MySQL queries, Helmet protection, and Zod-powered data validation.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18+ (Vite)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS & Framer Motion
- **Visualization**: Recharts (High-performance charting)

### Backend
- **Server**: Node.js & Express
- **Database**: MySQL (Optimized with `mysql2/promise`)
- **Security**: JWT, Bcrypt, Helmet, Express Rate Limit
- **Validation**: Zod (Schema-level validation)

## 📂 Project Architecture

```bash
├── backend/
│   ├── config/       # Database & Environment configuration
│   ├── controllers/  # Core business logic handlers
│   ├── routes/       # RESTful API endpoint definitions
│   ├── middleware/   # Auth, Role, & Security layers
│   └── sql/          # MySQL Schemas & Migration scripts
├── frontend/
│   ├── src/
│   │   ├── components/ # Atomic UI components
│   │   ├── contexts/   # Auth and Theme provider states
│   │   ├── layouts/    # Structural page wrappers
│   │   └── pages/      # View-level route components
```

## 🚀 Deployment & Installation

### 1. Database Initialization
Create a MySQL database named `salesbi_db` and initialize the schema:
```bash
mysql -u your_user -p salesbi_db < backend/sql/schema.sql
```

### 2. Backend Configuration
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` (if provided) and add:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=salesbi_db
   JWT_SECRET=your_secure_random_key
   PORT=5000
   ```
4. Start the server: `node index.js` (or `npm run dev`)

### 3. Frontend Configuration
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Launch development server: `npm run dev`

---

## 🛡 API Endpoints Reference

- **Auth**: `POST /api/auth/login` | `POST /api/auth/register`
- **Dashboard**: `GET /api/dashboard/kpis`
- **Inventory**: `GET /api/products` | `POST /api/products`

---

## 🚀 Deployment ($0 Budget)

To deploy this platform for free, we recommend the following "Zero-Budget" stack:

- **Frontend**: [Vercel](https://vercel.com) (React/Vite hosting)
- **Backend**: [Render](https://render.com) (Node.js Web Service)
- **Database**: [TiDB Cloud](https://tidbcloud.com) (Free MySQL-compatible cluster)

For a detailed step-by-step walkthrough, see our [Free Deployment Guide](./FREE_DEPLOYMENT.md).

---

> **Note**: This project is developed and maintained as an enterprise-grade reference for modern full-stack workflows.

Developed with ❤️ by **Mohamed Amine Nouioui**.
