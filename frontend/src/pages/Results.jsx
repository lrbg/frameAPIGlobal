import { useEffect, useState } from 'react'
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultBadge from '../components/ResultBadge'
import TestCard from '../components/TestCard'
import { staticApi } from '../services/api'

function RunRow({ run }) {
  const [open, setOpen] = useState(false)
  const tests = run?.results?.results ?? []

  return (
    <div className="card space-y-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {run.failed === 0 ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <XCircle size={18} className="text-red-400 shrink-0" />
          )}
          <div>
            <p className="font-medium text-white text-sm">
              {run.folder === 'all' ? 'Full Suite' : `${run.folder} tests`}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock size={11} />
              {new Date(run.timestamp).toLocaleString()} · {((run.duration || 0) / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ResultBadge passed={run.passed} failed={run.failed} total={run.total} />
          {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </div>

      {open && tests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-800">
          {tests.map((t, i) => <TestCard key={i} test={t} />)}
        </div>
      )}

      {open && tests.length === 0 && (
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">
          No detailed test data available. Run from the local backend for full details.
        </p>
      )}
    </div>
  )
}

export default function Results() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    staticApi.getResults()
      .then(data => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading results..." />

  const totalRuns = results.length
  const successRuns = results.filter(r => r.failed === 0 && r.total > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Results History</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalRuns} runs recorded · {totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0}% success rate
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-4">
          <ClipboardList size={40} className="text-gray-600" />
          <div className="text-center">
            <p className="text-gray-300 font-medium">No results yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Run tests from the Test Runner tab or trigger a GitHub Actions workflow.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r, i) => <RunRow key={r.runId || i} run={r} />)}
        </div>
      )}
    </div>
  )
}
