# Railway deployment guide

This deploys both the React frontend (built and served as static files) and the Express backend together as a single service. The backend serves the React build in production, so you only need one deployment.

## 1. Get a MongoDB database

The easiest way is **MongoDB Atlas** (free tier):

1. Go to https://cloud.mongodb.com and create an account
2. Create a free cluster (M0)
3. Under **Database Access**, create a database user with username + password
4. Under **Network Access**, allow `0.0.0.0/0` (Railway IPs change)
5. Click **Connect** → **Drivers** and copy the connection string
   It looks like: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Add the database name before the `?`, e.g. `...mongodb.net/team_task_manager?retryWrites=...`

## 2. Push your code to GitHub

```bash
cd team-task-manager
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/team-task-manager.git
git push -u origin main
```

## 3. Create a Railway project

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select the `team-task-manager` repo
4. Railway will detect the root `package.json` and start building

## 4. Add environment variables on Railway

Click your service → **Variables** tab and add:

| Key            | Value                                                            |
|----------------|------------------------------------------------------------------|
| `MONGO_URI`    | your MongoDB Atlas connection string from step 1                 |
| `JWT_SECRET`   | any long random string (e.g. run `openssl rand -hex 32`)          |
| `NODE_ENV`     | `production`                                                     |
| `CLIENT_URL`   | `*` (or your custom domain once you have one)                    |
| `PORT`         | leave empty — Railway sets this automatically                    |

## 5. Generate a public URL

1. Click your service → **Settings** → **Networking**
2. Click **Generate Domain**
3. Railway gives you a URL like `https://team-task-manager-production.up.railway.app`

## 6. Test it

Open the URL. You should see the landing page. Sign up — the first account becomes admin automatically.

## How the build works

The root `package.json` has these scripts:

- `npm run build` → installs both backend and frontend deps, then builds the React app to `frontend/build`
- `npm start` → starts the Express server (`backend/server.js`)

In production (`NODE_ENV=production`), the Express server serves the `frontend/build` folder as static files and falls back to `index.html` for client-side routing. So the same Railway service serves both API + frontend on the same domain.

## Updating

Just push to your `main` branch — Railway will redeploy automatically.

```bash
git add .
git commit -m "update"
git push
```

## Troubleshooting

- **"Application failed to respond"** — check the Deploy Logs. Usually it's a wrong `MONGO_URI` or missing `JWT_SECRET`.
- **MongoDB connection timeout** — make sure Atlas Network Access allows `0.0.0.0/0`.
- **404 on refresh** — make sure `NODE_ENV=production` is set so the catch-all route serves `index.html`.
- **CORS errors** — set `CLIENT_URL` to your Railway domain or `*`.
- **Build fails on `react-scripts`** — ensure Node 18+ is used (Railway uses the version from the root `engines.node` field).

## Custom domain (optional)

In the Networking tab click **Custom Domain**, add your domain (e.g. `tasks.example.com`), and follow the CNAME instructions.
