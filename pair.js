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
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const router = express.Router();

function removeFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
    }
}

function generatePairCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);
    const phoneNumber = (req.query.number || '').replace(/\D/g, '');

    if (!phoneNumber || phoneNumber.length < 7) {
        return res.status(400).json({ error: "Please provide a valid phone number with country code (digits only, e.g. 254712345678)" });
    }

    const pairCode = generatePairCode();
    let responded = false;
    let sessionDone = false;

    async function startSocket() {
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
            browser: Browsers.macOS("Safari"),
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            await delay(1500);
            try {
                await sock.requestPairingCode(phoneNumber, pairCode);
                if (!responded) {
                    responded = true;
                    res.json({ code: pairCode.match(/.{1,4}/g).join('-') });
                }
            } catch (err) {
                console.error('Pairing code error:', err.message);
                if (!responded) {
                    responded = true;
                    res.status(500).json({ error: 'Failed to generate pairing code: ' + err.message });
                }
                removeFolder(tempDir);
                return;
            }
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                sessionDone = true;
                console.log(`✅ Connected! Sending session to ${sock.user.id}`);
                await delay(5000);

                try {
                    const credsPath = path.join(tempDir, 'creds.json');
                    const sessionData = fs.readFileSync(credsPath, 'utf8');
                    const base64 = Buffer.from(sessionData).toString('base64');
                    const sessionId = 'PAPPET-XMD~' + base64;

                    await sock.sendMessage(sock.user.id, { text: sessionId });
                    await sock.sendMessage(sock.user.id, {
                        text:
                            `🚀 *PAPPET-XMD Session Created!*\n\n` +
                            `▸ Copy the long code sent above\n` +
                            `▸ Paste it as SESSION_ID in your PAPPET-XMD bot\n` +
                            `▸ *Never share* your session ID with anyone\n\n` +
                            `_Powered by PAPPET-XMD_`
                    });
                    console.log(`✅ Session ID sent to ${sock.user.id}`);
                } catch (err) {
                    console.error('❌ Error sending session:', err.message);
                } finally {
                    await delay(2000);
                    try { sock.ws.close(); } catch (_) {}
                    removeFolder(tempDir);
                }

            } else if (connection === 'close') {
                if (sessionDone) return;

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

                if (shouldReconnect) {
                    console.log(`🔁 Connection dropped (${statusCode}), reconnecting in 3s...`);
                    await delay(3000);
                    startSocket().catch(console.error);
                } else {
                    console.log('❌ Logged out or auth error, cleaning up');
                    removeFolder(tempDir);
                }
            }
        });
    }

    try {
        await startSocket();
    } catch (err) {
        console.error('Socket startup error:', err.message);
        if (!responded) {
            responded = true;
            res.status(500).json({ error: err.message });
        }
        removeFolder(tempDir);
    }

    setTimeout(() => {
        if (!sessionDone) {
            console.log(`⏱️ Session timeout for ${phoneNumber}, cleaning up`);
            removeFolder(tempDir);
        }
    }, 5 * 60 * 1000);
});

module.exports = router;
