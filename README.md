# PAPPET-XMD Session Generator

A web-based WhatsApp pairing code generator for PAPPET-XMD bot.

## How It Works

1. Open the web UI and enter your WhatsApp number (with country code, no + or spaces, e.g. `254712345678`)
2. Click **Generate Pair Code** — a code like `ABCD-EFGH` will appear
3. Open WhatsApp → **Linked Devices → Link with phone number** → enter the code
4. Once linked, your Session ID (`PAPPET-XMD~...`) is sent directly to your WhatsApp
5. Copy the Session ID and set it as the `SESSION_ID` environment variable in your PAPPET-XMD bot

## Setup

```bash
npm install
node index.js
```

The server runs on port `8001` by default (set `PORT` env variable to change).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8001` | Port the server listens on |
