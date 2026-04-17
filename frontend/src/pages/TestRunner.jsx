import { useEffect, useState } from 'react'
import { FlaskConical, Play, CheckCircle2, XCircle, Clock, Terminal } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultBadge from '../components/ResultBadge'
import TestCard from '../components/TestCard'
import { api } from '../services/api'

const GROUPS = [
  { id: 'all', label: 'All Resources', emoji: '⚡' },
  { id: 'pokemon', label: 'Pokemon', emoji: '🔴' },
  { id: 'berry', label: 'Berry', emoji: '🍒' },
  { id: 'item', label: 'Item', emoji: '🎒' },
  { id: 'move', label: 'Move', emoji: '⚔️' },
  { id: 'type', label: 'Type', emoji: '🌊' },
  { id: 'ability', label: 'Ability', emoji: '✨' },
]

export default function TestRunner() {
  const [selected, setSelected] = useState('all')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [collections, setCollections] = useState(null)

  useEffect(() => {
    api.getCollections()
      .then(setCollections)
      .catch(() => setCollections(null))
  }, [])

  async function handleRun() {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.runTests(selected === 'all' ? null : selected)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const tests = result?.results?.results ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Test Runner</h1>
        <p className="text-gray-400 text-sm mt-1">Execute Bruno collections against the PokéAPI</p>
      </div>

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

        {collections && (
          <p className="text-xs text-gray-500">
            {collections.total} tests across {collections.groups?.length} resource groups
          </p>
        )}

        <button
          onClick={handleRun}
          disabled={running}
          className="btn-primary"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={16} />
              Run {selected === 'all' ? 'All Tests' : `${selected} tests`}
            </>
          )}
        </button>
      </div>

      {/* Backend not available notice */}
      {error && (
        <div className="card border border-yellow-800 bg-yellow-950">
          <div className="flex items-start gap-3">
            <Terminal size={18} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-yellow-300">Backend not reachable</p>
              <p className="text-xs text-yellow-500 mt-1">
                Start the local server with <code className="bg-yellow-900 px-1 rounded">npm run dev</code> in the <code className="bg-yellow-900 px-1 rounded">/backend</code> folder, or trigger tests via GitHub Actions.
              </p>
              <p className="text-xs text-gray-500 mt-2 font-mono">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {running && <LoadingSpinner text="Running Bruno tests..." />}

      {result && !running && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FlaskConical size={18} className="text-blue-400" />
                Execution Summary
              </h2>
              <ResultBadge passed={result.passed} failed={result.failed} total={result.total} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Passed', value: result.passed, icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Failed', value: result.failed, icon: XCircle, color: 'text-red-400' },
                { label: 'Total', value: result.total, icon: FlaskConical, color: 'text-blue-400' },
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

          {/* Individual tests */}
          {tests.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Test Details</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {tests.map((t, i) => <TestCard key={i} test={t} />)}
              </div>
            </div>
          )}

          {/* Raw output */}
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
