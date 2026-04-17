const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const COLLECTIONS_PATH = path.join(__dirname, '../../../collections/pokeapi');

function extractBlock(content, blockName) {
  const lines = content.split('\n');
  let inside = false, depth = 0;
  const result = [];
  for (const line of lines) {
    if (!inside) {
      if (new RegExp('^' + blockName + '\\s*\\{').test(line.trim())) { inside = true; depth = 1; continue; }
    } else {
      for (const ch of line) { if (ch === '{') depth++; if (ch === '}') depth--; }
      if (depth <= 0) break;
      result.push(line);
    }
  }
  return result.join('\n');
}

function parseBruFile(content) {
  const meta = {};
  const request = {};
  const assertions = [];

  extractBlock(content, 'meta').split('\n').forEach(line => {
    const [key, ...val] = line.trim().split(':');
    if (key && val.length) meta[key.trim()] = val.join(':').trim();
  });

  const methodMatch = content.match(/^(get|post|put|delete|patch)\s*\{/im);
  if (methodMatch) {
    request.method = methodMatch[1].toUpperCase();
    const urlMatch = extractBlock(content, methodMatch[1]).match(/url:\s*(.+)/);
    if (urlMatch) request.url = urlMatch[1].trim();
  }

  extractBlock(content, 'assert').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed) assertions.push(trimmed);
  });

  return { meta, request, assertions };
}

function bruToOpenApiPath(url, baseUrl = 'https://pokeapi.co/api/v2') {
  let p = url.replace(baseUrl, '').replace('{{baseUrl}}', '');
  // Convert Bruno params like {{pokemonName}} to OpenAPI {pokemonName}
  p = p.replace(/\{\{(\w+)\}\}/g, '{$1}');
  return p || '/';
}

async function generateSwagger() {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'PokeAPI QA Test Collection',
      description: 'Auto-generated OpenAPI documentation from Bruno test collections. This document describes all tested endpoints with their expected responses and test assertions.',
      version: '1.0.0',
      contact: {
        name: 'QA Framework',
        url: 'https://github.com/lrbg/frameAPIGlobal'
      }
    },
    servers: [
      { url: 'https://pokeapi.co/api/v2', description: 'Production' }
    ],
    tags: [
      { name: 'Pokemon', description: 'Pokemon resource endpoints' },
      { name: 'Berry', description: 'Berry resource endpoints' },
      { name: 'Item', description: 'Item resource endpoints' },
      { name: 'Move', description: 'Move resource endpoints' },
      { name: 'Type', description: 'Type resource endpoints' },
      { name: 'Ability', description: 'Ability resource endpoints' }
    ],
    paths: {}
  };

  const folders = ['pokemon', 'berry', 'item', 'move', 'type', 'ability'];

  for (const folder of folders) {
    const folderPath = path.join(COLLECTIONS_PATH, folder);
    if (!(await fs.pathExists(folderPath))) continue;

    const files = await fs.readdir(folderPath);
    for (const file of files.filter(f => f.endsWith('.bru'))) {
      const content = await fs.readFile(path.join(folderPath, file), 'utf-8');
      const { meta, request, assertions } = parseBruFile(content);

      if (!request.method || !request.url) continue;

      const apiPath = bruToOpenApiPath(request.url);
      const method = request.method.toLowerCase();
      const tag = folder.charAt(0).toUpperCase() + folder.slice(1);

      if (!swagger.paths[apiPath]) swagger.paths[apiPath] = {};

      // Extract path parameters
      const pathParams = (apiPath.match(/\{(\w+)\}/g) || []).map(p => ({
        name: p.replace(/[{}]/g, ''),
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `${tag} identifier`
      }));

      // Extract query params
      const hasLimit = request.url.includes('limit') || file.includes('list');
      const queryParams = hasLimit ? [
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 }, description: 'Number of results' },
        { name: 'offset', in: 'query', required: false, schema: { type: 'integer', default: 0 }, description: 'Pagination offset' }
      ] : [];

      swagger.paths[apiPath][method] = {
        tags: [tag],
        summary: meta.name || `${method.toUpperCase()} ${apiPath}`,
        description: `**Test Assertions:**\n${assertions.map(a => `- \`${a}\``).join('\n') || 'Standard status 200 check'}`,
        operationId: `${method}_${folder}_${file.replace('.bru', '').replace(/-/g, '_')}`,
        parameters: [...pathParams, ...queryParams],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          '404': { description: 'Resource not found' },
          '500': { description: 'Server error' }
        }
      };
    }
  }

  return swagger;
}

router.get('/swagger', async (req, res) => {
  try {
    const swagger = await generateSwagger();
    res.json(swagger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
