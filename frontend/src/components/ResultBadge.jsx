import { CheckCircle2, XCircle, Minus } from 'lucide-react'

export default function ResultBadge({ passed, failed, total }) {
  if (total === 0 || total == null) return <span className="badge-pending">No data</span>
  if (failed === 0) return (
    <span className="badge-pass flex items-center gap-1">
      <CheckCircle2 size={12} /> {passed}/{total} Passed
    </span>
  )
  return (
    <span className="badge-fail flex items-center gap-1">
      <XCircle size={12} /> {failed} Failed · {passed}/{total}
    </span>
  )
}
