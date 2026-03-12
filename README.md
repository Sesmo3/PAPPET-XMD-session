# PAPPET-XMD Session Generator

Deploy to Railway, Render, or any Node.js host.

## Setup
```bash
npm install
node index.js
```

## Usage
1. Enter WhatsApp number with country code, no + or spaces (e.g. 254712345678)
2. Click Generate Pair Code
3. Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number instead
4. Enter the code shown
5. Your Session ID (PAPPET-XMD~...) will be sent to your WhatsApp
6. Set it as SESSION_ID env variable in your PAPPET-XMD bot

## Notes
- PORT env variable is read automatically (Railway/Render inject this)
- Health check available at /health
