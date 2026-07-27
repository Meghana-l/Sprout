# Sprout — deploy guide

A public demo: a static page (`index.html`) + one serverless function (`api/generate.js`)
that calls Groq (free tier) using a key kept safely on the server. No build step.

## Folder layout (keep it exactly like this)
```
sprout-deploy/
├─ index.html
├─ api/
│  └─ generate.js
└─ README.md
```

## Deploy to Vercel (2 minutes)

**Dashboard:**
1. Push this folder to a GitHub repo (or drag-and-drop the folder at vercel.com/new).
2. Import it in Vercel. Framework preset: **Other**. No build command.
3. In **Settings → Environment Variables**, add:
   - Name: `GROQ_API_KEY`
   - Value: your Groq key (the same one you already use). Free keys: console.groq.com/keys
4. Redeploy. Your live URL is ready to share.

**Or CLI:**
```
npm i -g vercel
cd sprout-deploy
vercel
vercel env add GROQ_API_KEY   # paste your Groq key when asked
vercel --prod
```

## Notes
- The key lives only in Vercel's server env — never in the browser.
- Model is `llama-3.3-70b-versatile` (free on Groq), set in `api/generate.js`.
  For faster/cheaper, switch that one line to `llama-3.1-8b-instant`.
- Groq free tier is rate-limited but plenty for a demo.
