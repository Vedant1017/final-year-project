# SnapCart Lite

Vite + React frontend and Express + Postgres backend for a hyperlocal demo app.

## Deploy (recommended): Render (backend) + Vercel (frontend)

### 1) Deploy backend to Render

- Create a new **Web Service** from this repo.
- **Root directory**: `hyperlocal-backend`
- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`

Create a **PostgreSQL** database on Render and copy its `DATABASE_URL`.

Set Render environment variables:
- `DATABASE_URL` = (from Render Postgres)
- `JWT_SECRET` = any random string
- `CORS_ORIGIN` = your Vercel URL, e.g. `https://final-year-project.vercel.app`

Run these once in the Render Shell (or as one-off jobs):
- `npm run db:migrate`
- `npm run db:seed`

### 2) Deploy frontend to Vercel

- Import the GitHub repo in Vercel.
- **Root directory**: `hyperlocal-frontend`
- Framework: **Vite**
- Build: `npm run build`
- Output: `dist`

Add Vercel env var:
- `VITE_API_BASE_URL` = `https://<your-render-backend>/api/v1`

`vercel.json` is included so refreshes on routes like `/login` work.

## Local dev

Backend:
```powershell
cd "d:\Final Year project\hyperlocal-backend"
cmd /c "call ""C:\Program Files\nodejs\nodevars.bat"" && npm start"
```

Frontend:
```powershell
cd "d:\Final Year project\hyperlocal-frontend"
cmd /c "call ""C:\Program Files\nodejs\nodevars.bat"" && npm run dev"
```

