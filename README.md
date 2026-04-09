# COINVERSE Dashboard (Render + Cloudflare)

## STEP 1: Push To GitHub
1. Put this `coinverse-dashboard` folder in your repo.
2. Commit and push to `main`.

## STEP 2: Deploy Backend On Render
1. In Render, create a Web Service from your GitHub repo.
2. Set Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variable:
   - `API_KEY=12341`
6. Deploy and copy backend URL (example: `https://coinverse-dashboard.onrender.com`).

## STEP 3: Deploy Frontend On Cloudflare Pages
1. In Cloudflare Pages, create a project from your GitHub repo.
2. Set Production Branch: `main`
3. Set Root Directory: `frontend`
4. Build command: leave empty
5. Build output directory: leave empty
6. Deploy.

## STEP 4: Set Frontend API URL
Edit `frontend/config.js`:
- `API_URL` = your Render URL
- `API_KEY` = `12341`
Then commit and push.

## STEP 5: Plugin Config
Use this in plugin `config.yml`:

backend:
  enabled: true
  base-url: "https://your-render-url.onrender.com"
  api-key: "12341"

## Local Run
1. `cd backend`
2. `npm install`
3. `npm start`
4. Open frontend by hosting `frontend` as static files.

## API Security
All API routes except `/` require header:
- `x-api-key: 12341`
