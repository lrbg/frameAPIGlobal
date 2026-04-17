import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { FlaskConical, CheckCircle2, XCircle, Clock, Layers, ArrowRight } from 'lucide-react'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { staticApi } from '../services/api'

const COLORS = ['#10b981', '#ef4444', '#f59e0b']

export default function Dashboard() {
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [collections, setCollections] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      staticApi.getLatestResult(),
      staticApi.getResults(),
    ]).then(([latestRes, historyRes]) => {
      if (latestRes.status === 'fulfilled') setLatest(latestRes.value)
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const passed = latest?.passed ?? 0
  const failed = latest?.failed ?? 0
  const total = latest?.total ?? 0
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

  const pieData = total > 0
    ? [
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed },
      ]
    : [{ name: 'No data', value: 1 }]

  const barData = history.slice(0, 10).reverse().map((r, i) => ({
    run: `#${i + 1}`,
    passed: r.passed || 0,
    failed: r.failed || 0,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {latest?.timestamp
              ? `Last run: ${new Date(latest.timestamp).toLocaleString()}`
              : 'No tests run yet'}
          </p>
        </div>
        <Link to="/tests" className="btn-primary">
          <FlaskConical size={16} /> Run Tests
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pass Rate" value={`${passRate}%`} color="blue" icon={CheckCircle2} />
        <StatCard label="Passed" value={passed} color="green" icon={CheckCircle2} />
        <StatCard label="Failed" value={failed} color="red" icon={XCircle} />
        <StatCard label="Total Tests" value={total} color="purple" icon={Layers} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Latest Run</h2>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Run tests to see results</div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {pieData.filter(d => d.name !== 'No data').map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Bar history */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Run History</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="run" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="passed" fill="#10b981" name="Passed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No history yet</div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/tests', label: 'Run Tests', desc: 'Execute Bruno collections by resource group', icon: FlaskConical, color: 'blue' },
          { to: '/results', label: 'View Results', desc: 'Browse past execution reports', icon: Clock, color: 'purple' },
          { to: '/docs', label: 'API Docs', desc: 'Auto-generated Swagger documentation', icon: Layers, color: 'green' },
        ].map(({ to, label, desc, icon: Icon, color }) => (
          <Link key={to} to={to} className="card hover:border-gray-600 transition-colors group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${color}-950 text-${color}-400`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
