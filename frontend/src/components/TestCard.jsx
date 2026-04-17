import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function TestCard({ test }) {
  const passed = test.passed ?? test.status === 'passed'
  const failed = test.failed ?? test.status === 'failed'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
      {passed && !failed ? (
        <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
      ) : failed ? (
        <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
      ) : (
        <Clock size={18} className="text-yellow-400 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{test.name || test.description}</p>
        {test.error && (
          <p className="text-xs text-red-400 mt-1 font-mono break-words">{test.error}</p>
        )}
        {test.duration != null && (
          <p className="text-xs text-gray-500 mt-0.5">{test.duration}ms</p>
        )}
      </div>
    </div>
  )
}
