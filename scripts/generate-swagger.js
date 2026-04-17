const fs = require('fs')
const path = require('path')

function extractBlock(content, blockName) {
  const lines = content.split('\n')
  let inside = false
  let depth = 0
  const result = []
  for (const line of lines) {
    if (!inside) {
      if (new RegExp('^' + blockName + '\\s*\\{').test(line.trim())) {
        inside = true
        depth = 1
        continue
      }
    } else {
      for (const ch of line) {
        if (ch === '{') depth++
        if (ch === '}') depth--
      }
      if (depth <= 0) break
      result.push(line)
    }
  }
  return result.join('\n')
}

function parseBru(content) {
  const meta = {}
  const request = {}
  const assertions = []

  const metaBlock = extractBlock(content, 'meta')
  metaBlock.split('\n').forEach(l => {
    const [k, ...v] = l.trim().split(':')
    if (k && v.length) meta[k.trim()] = v.join(':').trim()
  })

  const methodMatch = content.match(/^(get|post|put|delete|patch)\s*\{/im)
  if (methodMatch) {
    request.method = methodMatch[1].toUpperCase()
    const block = extractBlock(content, methodMatch[1])
    const urlM = block.match(/url:\s*(.+)/)
    if (urlM) request.url = urlM[1].trim()
  }

  const assertBlock = extractBlock(content, 'assert')
  assertBlock.split('\n').forEach(l => { if (l.trim()) assertions.push(l.trim()) })

  return { meta, request, assertions }
}

const swagger = {
  openapi: '3.0.0',
  info: {
    title: 'PokéAPI QA Collection',
    description: 'Auto-generated OpenAPI documentation from Bruno test collections.',
    version: '1.0.0',
    contact: { name: 'QA Framework', url: 'https://github.com/lrbg/frameAPIGlobal' }
  },
  servers: [{ url: 'https://pokeapi.co/api/v2', description: 'Production' }],
  tags: ['pokemon','berry','item','move','type','ability'].map(n => ({
    name: n.charAt(0).toUpperCase() + n.slice(1),
    description: n + ' resource endpoints'
  })),
  paths: {}
}

const ROOT = path.join(__dirname, '..')
const folders = ['pokemon','berry','item','move','type','ability']

for (const folder of folders) {
  const dir = path.join(ROOT, 'collections/pokeapi', folder)
  if (!fs.existsSync(dir)) continue
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.bru'))) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8')
    const { meta, request, assertions } = parseBru(content)
    if (!request.method || !request.url) continue

    let apiPath = request.url
      .replace('https://pokeapi.co/api/v2', '')
      .replace('{{baseUrl}}', '')
      .replace(/\?.*$/, '')
    // Convert Bruno {{param}} → OpenAPI {param}
    apiPath = apiPath.replace(/\{\{(\w+)\}\}/g, (_, p) => `{${p}}`)
    if (!apiPath) apiPath = '/'

    const method = request.method.toLowerCase()
    if (!swagger.paths[apiPath]) swagger.paths[apiPath] = {}

    const pathParams = (apiPath.match(/\{(\w+)\}/g) || []).map(p => ({
      name: p.replace(/[{}]/g, ''),
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: p.replace(/[{}]/g, '') + ' identifier'
    }))

    const hasQuery = request.url.includes('limit')
    const queryParams = hasQuery ? [
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 }, description: 'Number of results' },
      { name: 'offset', in: 'query', required: false, schema: { type: 'integer', default: 0 }, description: 'Pagination offset' }
    ] : []

    swagger.paths[apiPath][method] = {
      tags: [folder.charAt(0).toUpperCase() + folder.slice(1)],
      summary: meta.name || apiPath,
      description: assertions.length
        ? 'Test Assertions:\n' + assertions.map(a => '- `' + a + '`').join('\n')
        : 'Standard checks',
      operationId: method + '_' + folder + '_' + file.replace('.bru', '').replace(/-/g, '_'),
      parameters: [...pathParams, ...queryParams],
      responses: {
        '200': { description: 'Successful response', content: { 'application/json': { schema: { type: 'object' } } } },
        '404': { description: 'Resource not found' }
      }
    }
  }
}

const outDir = path.join(ROOT, 'frontend/public/data')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'swagger.json'), JSON.stringify(swagger, null, 2))
console.log(`swagger.json generated with ${Object.keys(swagger.paths).length} paths`)
