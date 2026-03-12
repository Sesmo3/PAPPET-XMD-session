# PAPPET-XMD Session Generator

A web-based WhatsApp pairing code generator for PAPPET-XMD bot.

## Deploy to Railway

1. Push these files to a GitHub repo
2. Go to [Railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Railway will automatically detect Node.js and run `npm install` + `npm start`
4. Railway injects the `PORT` env variable automatically — do **not** hardcode a port
5. Once deployed, open your Railway URL and start pairing

## How It Works

1. Open the app URL
2. Enter your WhatsApp number with country code (no + or spaces, e.g. `254712345678`)
3. Click **Generate Pair Code** — a code like `ABCD-EFGH` appears on screen
4. Open WhatsApp → **Linked Devices → Link with phone number** → enter the code
5. Once linked, your Session ID (`PAPPET-XMD~...`) is sent directly to your own WhatsApp chat
6. Copy it and set it as the `SESSION_ID` environment variable in your PAPPET-XMD bot

## Local Setup

```bash
npm install
node index.js
```

Server runs on port `8001` by default, or whatever `PORT` env variable is set.

## Health Check

GET `/health` returns `{ "status": "ok", "port": <port> }`
