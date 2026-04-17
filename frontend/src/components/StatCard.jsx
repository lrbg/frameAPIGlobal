export default function StatCard({ label, value, sub, color = 'blue', icon: Icon }) {
  const colors = {
    blue:    'text-blue-400 bg-blue-950 border-blue-800',
    green:   'text-emerald-400 bg-emerald-950 border-emerald-800',
    red:     'text-red-400 bg-red-950 border-red-800',
    yellow:  'text-yellow-400 bg-yellow-950 border-yellow-800',
    purple:  'text-purple-400 bg-purple-950 border-purple-800',
  }
  return (
    <div className={`card flex items-center gap-4 border ${colors[color]}`}>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-opacity-30 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
