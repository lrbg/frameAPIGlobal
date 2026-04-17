const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const RESULTS_DIR = path.join(__dirname, '../../results');

router.get('/results', async (req, res) => {
  try {
    await fs.ensureDir(RESULTS_DIR);
    const files = await fs.readdir(RESULTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'latest.json' && f !== '.gitkeep');

    const results = await Promise.all(
      jsonFiles.map(async (f) => {
        const data = await fs.readJson(path.join(RESULTS_DIR, f));
        return { file: f, ...data };
      })
    );

    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(results.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/results/latest', async (req, res) => {
  try {
    const latestFile = path.join(RESULTS_DIR, 'latest.json');
    if (await fs.pathExists(latestFile)) {
      const data = await fs.readJson(latestFile);
      res.json(data);
    } else {
      res.json({ message: 'No results yet. Run tests first.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/results/:runId', async (req, res) => {
  try {
    const file = path.join(RESULTS_DIR, `${req.params.runId}.json`);
    if (await fs.pathExists(file)) {
      res.json(await fs.readJson(file));
    } else {
      res.status(404).json({ error: 'Result not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
