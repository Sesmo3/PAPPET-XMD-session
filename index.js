const express = require('express');
const path = require('path');
const app = express();

require('events').EventEmitter.defaultMaxListeners = 500;

const pairCode = require('./pair');

const PORT = process.env.PORT || 8001;

app.use('/code', pairCode);

app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ PAPPET-XMD Session Server running at http://0.0.0.0:${PORT}`);
});

module.exports = app;
