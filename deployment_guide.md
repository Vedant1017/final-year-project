# 🚀 SnapCart Deployment Guide (Free Tier)

This guide walks you through deploying your full-stack application for free using **Render** (Backend) and **Vercel** (Frontend).

## Prerequisites
1. A **GitHub** account.
2. A **MongoDB Atlas** account (already setup).
3. A **Razorpay** account (if using payments).

---

## 1. Prepare Your GitHub Repository
Push your entire folder to a single GitHub repository. Since your frontend and backend are in subdirectories, you will need to specify the **Root Directory** during deployment.

---

## 2. Deploy Backend (Render.com)
Render is perfect for Node.js apps with WebSockets.

1. **Sign up** at [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. **Configuration**:
   - **Name**: `snapcart-backend`
   - **Root Directory**: `hyperlocal-backend`  <-- **CRITICAL FOR MONOREPO**
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables**: Click "Advanced" and add:
   - `MONGODB_URI`: *Your Atlas connection string*
   - `JWT_SECRET`: *Any random long string*
   - `RAZORPAY_KEY_ID`: *(Optional)*
   - `RAZORPAY_KEY_SECRET`: *(Optional)*
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app` (Add this later after deploying frontend)
6. **Deploy**: Render will give you a URL like `https://snapcart-backend.onrender.com`.

---

## 3. Deploy Frontend (Vercel.com)
Vercel is the best platform for React/Vite apps.

1. **Sign up** at [Vercel.com](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `hyperlocal-frontend`  <-- **CRITICAL FOR MONOREPO**
5. **Environment Variables**:
   - Add `VITE_API_BASE_URL`: `https://snapcart-backend.onrender.com` (The URL you got from Render).
6. **Deploy**: Vercel will give you a URL like `https://snapcart-frontend.vercel.app`.

---

## 4. Final Connection
1. Go back to your **Render** dashboard (Backend).
2. Add your Vercel URL to the `CORS_ORIGIN` environment variable.
3. This allows your local React app to communicate with your live server securely.

---

## ✅ Post-Deployment Check
Visit `https://your-backend-url.onrender.com/api/v1/ping`. 
If you see `{"success": true, "status": "ok"}`, your backend is alive and healthy!

> [!TIP]
> **Database Access**: Don't forget to go to **MongoDB Atlas** > **Network Access** and add `0.0.0.0/0` (Allow access from anywhere) so Render can connect to your database.
