const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export const api = {
  health: () => request('/health'),
  getCollections: () => request('/collections'),
  runTests: (folder) =>
    request('/run-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder ? { folder } : {}),
    }),
  getResults: () => request('/results'),
  getLatestResult: () => request('/results/latest'),
  getResult: (runId) => request(`/results/${runId}`),
  getSwagger: () => request('/swagger'),
}

// For GitHub Pages static mode: reads pre-generated JSON files committed to /public/data/
export const staticApi = {
  getSwagger: () => fetch('./data/swagger.json').then(r => r.json()),
  getLatestResult: () => fetch('./data/latest.json').then(r => r.json()).catch(() => null),
  getResults: () => fetch('./data/history.json').then(r => r.json()).catch(() => []),
}
