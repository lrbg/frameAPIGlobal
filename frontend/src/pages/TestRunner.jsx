import { useEffect, useState } from 'react'
import {
  FlaskConical, Play, CheckCircle2, XCircle, Clock,
  Terminal, Github, Key, ExternalLink, RefreshCw, Info,
  ChevronDown, ChevronUp, Cpu
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultBadge from '../components/ResultBadge'
import TestCard from '../components/TestCard'
import { api, staticApi } from '../services/api'

const REPO = 'lrbg/frameAPIGlobal'
const WORKFLOW_ID = 'run-tests.yml'
const GH_ACTIONS_URL = `https://github.com/${REPO}/actions/workflows/${WORKFLOW_ID}`

const GROUPS = [
  { id: 'all',     label: 'All Resources', emoji: '⚡' },
  { id: 'pokemon', label: 'Pokemon',        emoji: '🔴' },
  { id: 'berry',   label: 'Berry',          emoji: '🍒' },
  { id: 'item',    label: 'Item',           emoji: '🎒' },
  { id: 'move',    label: 'Move',           emoji: '⚔️'  },
  { id: 'type',    label: 'Type',           emoji: '🌊' },
  { id: 'ability', label: 'Ability',        emoji: '✨' },
]

// Detects if running as GitHub Pages static build (no backend available)
const IS_STATIC = import.meta.env.VITE_API_URL === undefined &&
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'

export default function TestRunner() {
  const [selected, setSelected]       = useState('all')
  const [running, setRunning]         = useState(false)
  const [result, setResult]           = useState(null)
  const [backendOk, setBackendOk]     = useState(null)   // null = unknown, true/false
  const [ghToken, setGhToken]         = useState(() => localStorage.getItem('gh_pat') || '')
  const [showToken, setShowToken]     = useState(false)
  const [tokenSaved, setTokenSaved]   = useState(false)
  const [ghStatus, setGhStatus]       = useState(null)   // dispatched | polling | done | error
  const [ghMessage, setGhMessage]     = useState('')
  const [polledResult, setPolledResult] = useState(null)
  const [showTokenPanel, setShowTokenPanel] = useState(false)

  // Check backend health on mount
  useEffect(() => {
    api.health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  function saveToken(val) {
    const trimmed = val.trim()
    setGhToken(trimmed)
    localStorage.setItem('gh_pat', trimmed)
    setTokenSaved(true)
    setTimeout(() => setTokenSaved(false), 2000)
  }

  // ── Run via local backend ──────────────────────────────────────────────────
  async function handleRunLocal() {
    setRunning(true)
    setResult(null)
    try {
      const data = await api.runTests(selected === 'all' ? null : selected)
      setResult(data)
    } catch {
      setBackendOk(false)
    } finally {
      setRunning(false)
    }
  }

  // ── Trigger GitHub Actions workflow ───────────────────────────────────────
  async function handleTriggerGH() {
    if (!ghToken) { setShowTokenPanel(true); return }
    setGhStatus('dispatched')
    setGhMessage('Dispatching workflow…')
    setPolledResult(null)

    const body = {
      ref: 'main',
      inputs: selected === 'all' ? {} : { folder: selected },
    }

    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (res.status === 204) {
        setGhStatus('polling')
        setGhMessage('Workflow triggered! Waiting for results (≈60s)…')
        pollForResult()
      } else if (res.status === 401) {
        setGhStatus('error')
        setGhMessage('Token inválido o sin permisos. Necesita scope "workflow".')
      } else if (res.status === 403) {
        setGhStatus('error')
        setGhMessage('Acceso denegado. Verifica que el token tenga scope "workflow".')
      } else {
        const text = await res.text()
        setGhStatus('error')
        setGhMessage(`Error ${res.status}: ${text}`)
      }
    } catch (err) {
      setGhStatus('error')
      setGhMessage(`Error de red: ${err.message}`)
    }
  }

  // Poll latest.json until it has a newer timestamp (max 90s)
  async function pollForResult() {
    const startTime = Date.now()
    const maxWait = 90_000
    const interval = 6_000

    // Get current latest timestamp before we dispatched
    let prevTimestamp = null
    try {
      const prev = await staticApi.getLatestResult()
      prevTimestamp = prev?.timestamp || null
    } catch {}

    // Wait 15s for the workflow to start
    await new Promise(r => setTimeout(r, 15_000))

    const poll = async () => {
      if (Date.now() - startTime > maxWait) {
        setGhStatus('done')
        setGhMessage('El workflow fue disparado. Refresca la página en unos momentos para ver los resultados.')
        return
      }
      try {
        const latest = await staticApi.getLatestResult()
        if (latest?.timestamp && latest.timestamp !== prevTimestamp && latest.total != null) {
          setPolledResult(latest)
          setGhStatus('done')
          setGhMessage(`Completado: ${latest.passed} passed · ${latest.failed} failed · ${latest.total} total`)
          return
        }
      } catch {}
      setTimeout(poll, interval)
    }
    poll()
  }

  const tests = result?.results?.results ?? []
  const useGHMode = backendOk === false || IS_STATIC

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Test Runner</h1>
        <p className="text-gray-400 text-sm mt-1">Execute Bruno collections against the PokéAPI</p>
      </div>

      {/* Mode badge */}
      {backendOk !== null && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          backendOk
            ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
            : 'bg-blue-950 border-blue-800 text-blue-300'
        }`}>
          <Cpu size={12} />
          {backendOk ? 'Local backend detected — full execution mode' : 'Static mode — using GitHub Actions'}
        </div>
      )}

      {/* Group selector */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Select Resource Group</h2>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setSelected(g.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selected === g.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>

        {/* Run buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          {/* Local run (shown if backend ok) */}
          {backendOk && (
            <button onClick={handleRunLocal} disabled={running} className="btn-primary">
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running locally…
                </>
              ) : (
                <><Play size={16} /> Run {selected === 'all' ? 'All Tests' : `${selected}`} locally</>
              )}
            </button>
          )}

          {/* GitHub Actions trigger (always shown when no backend) */}
          {useGHMode && (
            <button
              onClick={handleTriggerGH}
              disabled={ghStatus === 'dispatched' || ghStatus === 'polling'}
              className="btn-primary"
            >
              {ghStatus === 'dispatched' || ghStatus === 'polling' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {ghStatus === 'dispatched' ? 'Dispatching…' : 'Waiting for results…'}
                </>
              ) : (
                <><Github size={16} /> Trigger via GitHub Actions</>
              )}
            </button>
          )}

          {/* Open GH Actions page */}
          <a
            href={GH_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <ExternalLink size={14} /> Open Actions on GitHub
          </a>
        </div>
      </div>

      {/* Token panel */}
      {useGHMode && (
        <div className="card border border-gray-700">
          <button
            onClick={() => setShowTokenPanel(p => !p)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Key size={15} className="text-blue-400" />
              GitHub Personal Access Token (PAT) — required to trigger workflows
            </div>
            {showTokenPanel ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
          </button>

          {showTokenPanel && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={ghToken}
                  onChange={e => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => setShowToken(s => !s)} className="btn-secondary text-xs px-3">
                  {showToken ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => saveToken(ghToken)} className="btn-primary text-xs px-4">
                  {tokenSaved ? <><CheckCircle2 size={13} /> Saved</> : 'Save'}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 space-y-1.5 text-xs text-gray-400">
                <p className="flex items-center gap-1.5 text-gray-300 font-medium">
                  <Info size={12} className="text-blue-400" /> How to create a GitHub PAT:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>
                    Go to{' '}
                    <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 underline">
                      github.com/settings/tokens/new
                    </a>
                  </li>
                  <li>Set a note (e.g. <code className="bg-gray-700 px-1 rounded">QA Framework</code>)</li>
                  <li>Select scope: <code className="bg-gray-700 px-1 rounded">workflow</code></li>
                  <li>Click <strong>Generate token</strong> and paste it above</li>
                </ol>
                <p className="text-yellow-600 mt-1">The token is stored only in your browser's localStorage.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GitHub Actions status */}
      {ghStatus && (
        <div className={`card border ${
          ghStatus === 'error'
            ? 'border-red-800 bg-red-950'
            : ghStatus === 'done'
            ? 'border-emerald-800 bg-emerald-950'
            : 'border-blue-800 bg-blue-950'
        }`}>
          <div className="flex items-start gap-3">
            {ghStatus === 'polling' || ghStatus === 'dispatched' ? (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mt-0.5 shrink-0" />
            ) : ghStatus === 'done' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                ghStatus === 'error' ? 'text-red-300' : ghStatus === 'done' ? 'text-emerald-300' : 'text-blue-300'
              }`}>
                {ghStatus === 'dispatched' && 'Dispatching workflow to GitHub Actions…'}
                {ghStatus === 'polling'    && 'Workflow running — waiting for results…'}
                {ghStatus === 'done'       && 'Workflow complete'}
                {ghStatus === 'error'      && 'Trigger failed'}
              </p>
              <p className="text-xs mt-1 text-gray-400">{ghMessage}</p>
              {ghStatus === 'done' && (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary text-xs mt-3 gap-1"
                >
                  <RefreshCw size={12} /> Refresh dashboard
                </button>
              )}
              {ghStatus === 'error' && ghMessage.includes('Token') && (
                <button onClick={() => setShowTokenPanel(true)} className="btn-secondary text-xs mt-2">
                  Configure Token
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Polled results from GitHub Actions */}
      {polledResult && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Github size={18} className="text-blue-400" /> GitHub Actions Result
            </h2>
            <ResultBadge passed={polledResult.passed} failed={polledResult.failed} total={polledResult.total} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Passed', value: polledResult.passed, color: 'text-emerald-400', icon: CheckCircle2 },
              { label: 'Failed', value: polledResult.failed, color: 'text-red-400',     icon: XCircle },
              { label: 'Total',  value: polledResult.total,  color: 'text-blue-400',    icon: FlaskConical },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                <Icon size={16} className={color} />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Run at {new Date(polledResult.timestamp).toLocaleString()} · commit {polledResult.commit}
          </p>
        </div>
      )}

      {/* Local run results */}
      {running && <LoadingSpinner text="Running Bruno tests locally…" />}

      {result && !running && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FlaskConical size={18} className="text-blue-400" /> Execution Summary
              </h2>
              <ResultBadge passed={result.passed} failed={result.failed} total={result.total} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Passed',   value: result.passed,                              icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Failed',   value: result.failed,                              icon: XCircle,      color: 'text-red-400' },
                { label: 'Total',    value: result.total,                               icon: FlaskConical, color: 'text-blue-400' },
                { label: 'Duration', value: `${((result.duration || 0) / 1000).toFixed(1)}s`, icon: Clock, color: 'text-purple-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                  <Icon size={16} className={color} />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {tests.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Test Details</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {tests.map((t, i) => <TestCard key={i} test={t} />)}
              </div>
            </div>
          )}

          {result.stdout && (
            <details className="card">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200 flex items-center gap-2">
                <Terminal size={14} /> Raw Output
              </summary>
              <pre className="mt-3 text-xs text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto bg-gray-950 p-3 rounded-lg max-h-64 overflow-y-auto">
                {result.stdout}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
