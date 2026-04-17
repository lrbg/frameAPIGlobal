import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FlaskConical, ClipboardList, BookOpen, Zap } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tests', label: 'Run Tests', icon: FlaskConical },
  { to: '/results', label: 'Results', icon: ClipboardList },
  { to: '/docs', label: 'Documentation', icon: BookOpen },
]

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">QA API Framework</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">PokéAPI · Bruno + Node.js</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
