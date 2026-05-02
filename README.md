# TLV Flight Finder

Round-trip flight fare explorer from Tel Aviv, powered by SerpAPI + Google Flights.

---

## Run locally

```bash
node server.js
# → open http://localhost:3333
```

No npm install needed — uses only built-in Node.js modules.

---

## Deploy to cloud (Render.com — free)

### Step 1 — Push to GitHub
1. Create a free account at https://github.com
2. Create a new repository (e.g. `tlv-flights`)
3. Upload all three files: `server.js`, `index.html`, `package.json`

### Step 2 — Deploy on Render
1. Go to https://render.com and sign up (free, no credit card)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name:** tlv-flights (or anything)
   - **Runtime:** Node
   - **Build Command:** *(leave empty)*
   - **Start Command:** `node server.js`
5. Click **Create Web Service**

Render gives you a URL like `https://tlv-flights.onrender.com`

### Step 3 — Set your SerpAPI key (optional but recommended)
In Render dashboard → your service → **Environment** tab:
- Key: `SERPAPI_KEY`
- Value: your SerpAPI key

This way the key lives on the server and you don't need to paste it in the browser.
Users just open the URL and search — no key needed in the UI.

### Step 4 — Open on any device
Share your Render URL with anyone. The page auto-detects it's running in the cloud
and points API calls at the right server.

---

## SerpAPI free tier
- 250 searches/month, no credit card
- Sign up: https://serpapi.com/users/sign_up

---

## Files
| File | Purpose |
|------|---------|
| `server.js` | Node.js server — proxies SerpAPI calls, serves the frontend |
| `index.html` | Frontend UI |
| `package.json` | Tells Render/Railway this is a Node app |
