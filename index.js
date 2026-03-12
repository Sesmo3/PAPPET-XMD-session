const express = require('express');
const path = require('path');
const app = express();

require('events').EventEmitter.defaultMaxListeners = 500;

const PORT = process.env.PORT || 8001;

app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

app.use('/code', require('./pair'));

app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ PAPPET-XMD Session Server running on port ${PORT}`);
    console.log(`   Open http://0.0.0.0:${PORT} to start pairing`);
});

module.exports = app;
