const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const testsRouter = require('./routes/tests');
const resultsRouter = require('./routes/results');
const docsRouter = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', testsRouter);
app.use('/api', resultsRouter);
app.use('/api', docsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
