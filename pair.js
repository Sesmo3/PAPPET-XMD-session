const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const router = express.Router();

function removeFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);
    const phoneNumber = (req.query.number || '').replace(/\D/g, '');

    if (!phoneNumber) {
        return res.status(400).json({ error: "Please provide a valid phone number" });
    }

    let responded = false;

    async function createSocketSession() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        const logger = pino({ level: "fatal" }).child({ level: "fatal" });

        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            printQRInTerminal: false,
            generateHighQualityLinkPreview: true,
            logger,
            syncFullHistory: false,
            browser: Browsers.macOS("Safari")
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            await delay(2000);
            try {
                const code = await sock.requestPairingCode(phoneNumber, null);
                if (!responded) {
                    responded = true;
                    res.json({ code: code?.match(/.{1,4}/g)?.join('-') || code });
                }
            } catch (err) {
                if (!responded) {
                    responded = true;
                    res.status(500).json({ error: err.message });
                }
                removeFolder(tempDir);
                return;
            }
        }

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await delay(5000);

                try {
                    const credsPath = path.join(tempDir, 'creds.json');
                    const sessionData = fs.readFileSync(credsPath, 'utf8');
                    const base64 = Buffer.from(sessionData).toString('base64');
                    const sessionId = "PAPPET-XMD~" + base64;

                    await sock.sendMessage(sock.user.id, { text: sessionId });

                    const successMsg = {
                        text:
                            `🚀 *PAPPET-XMD Session Created!*\n\n` +
                            `▸ *Never share* your session ID with anyone\n` +
                            `▸ Copy the session ID sent above and paste it into your SESSION_ID env variable\n` +
                            `▸ Report bugs on GitHub\n\n` +
                            `_Powered by PAPPET-XMD_`
                    };

                    await sock.sendMessage(sock.user.id, successMsg);
                    console.log(`✅ Session created for ${sock.user.id}`);

                } catch (err) {
                    console.error("❌ Session Error:", err.message);
                    try {
                        await sock.sendMessage(sock.user.id, {
                            text: `⚠️ Error saving session: ${err.message}`
                        });
                    } catch (_) {}
                } finally {
                    await delay(1000);
                    try { sock.ws.close(); } catch (_) {}
                    removeFolder(tempDir);
                }

            } else if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === 401) {
                    console.log("❌ Session expired or logged out");
                    removeFolder(tempDir);
                } else {
                    console.log("🔁 Connection closed, cleaning up...");
                    removeFolder(tempDir);
                }
            }
        });
    }

    try {
        await createSocketSession();
    } catch (err) {
        if (!responded) {
            responded = true;
            res.status(500).json({ error: err.message });
        }
        removeFolder(tempDir);
    }
});

module.exports = router;
