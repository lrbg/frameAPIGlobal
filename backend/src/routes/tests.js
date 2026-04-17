const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const COLLECTIONS_PATH = path.join(__dirname, '../../../collections/pokeapi');
const RESULTS_DIR = path.join(__dirname, '../../results');

router.get('/collections', async (req, res) => {
  try {
    // Read and parse Bruno collection structure
    const brunoJson = await fs.readJson(path.join(COLLECTIONS_PATH, 'bruno.json'));
    const folders = ['pokemon', 'berry', 'item', 'move', 'type', 'ability'];
    const collections = [];

    for (const folder of folders) {
      const folderPath = path.join(COLLECTIONS_PATH, folder);
      if (await fs.pathExists(folderPath)) {
        const files = await fs.readdir(folderPath);
        const bruFiles = files.filter(f => f.endsWith('.bru'));
        const tests = bruFiles.map(f => ({
          name: f.replace('.bru', '').replace(/-/g, ' '),
          file: f,
          folder
        }));
        collections.push({ name: folder, tests, count: tests.length });
      }
    }

    res.json({ collection: brunoJson.name, groups: collections, total: collections.reduce((a, c) => a + c.count, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/run-tests', async (req, res) => {
  const { folder } = req.body; // optional: run specific folder
  const runId = uuidv4();
  const resultFile = path.join(RESULTS_DIR, `${runId}.json`);
  const latestFile = path.join(RESULTS_DIR, 'latest.json');

  await fs.ensureDir(RESULTS_DIR);

  const targetPath = folder ? path.join(COLLECTIONS_PATH, folder) : COLLECTIONS_PATH;

  // Try to find bru binary
  const bruBin = path.join(__dirname, '../../../node_modules/.bin/bru');
  const altBruBin = path.join(__dirname, '../../node_modules/.bin/bru');

  let binPath = 'bru'; // fallback to global
  if (await fs.pathExists(bruBin)) binPath = bruBin;
  else if (await fs.pathExists(altBruBin)) binPath = altBruBin;

  const args = ['run', '--env', 'Prod', '--reporter-json', resultFile, '--no-bail', targetPath];

  const startTime = Date.now();

  const process_run = spawn(binPath, args, {
    cwd: COLLECTIONS_PATH,
    env: { ...process.env }
  });

  let stdout = '';
  let stderr = '';

  process_run.stdout.on('data', (data) => { stdout += data.toString(); });
  process_run.stderr.on('data', (data) => { stderr += data.toString(); });

  process_run.on('close', async (code) => {
    const duration = Date.now() - startTime;

    let results = null;
    if (await fs.pathExists(resultFile)) {
      results = await fs.readJson(resultFile);
    }

    const summary = {
      runId,
      timestamp: new Date().toISOString(),
      duration,
      folder: folder || 'all',
      exitCode: code,
      stdout,
      stderr,
      results,
      passed: results?.summary?.passedTestCount || 0,
      failed: results?.summary?.failedTestCount || 0,
      total: results?.summary?.totalTestCount || 0
    };

    await fs.writeJson(resultFile, summary, { spaces: 2 });
    await fs.writeJson(latestFile, summary, { spaces: 2 });

    res.json(summary);
  });

  process_run.on('error', async (err) => {
    const summary = {
      runId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      folder: folder || 'all',
      error: err.message,
      passed: 0,
      failed: 0,
      total: 0
    };
    await fs.writeJson(resultFile, summary, { spaces: 2 });
    await fs.writeJson(latestFile, summary, { spaces: 2 });
    res.status(500).json(summary);
  });
});

module.exports = router;
