import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import TestRunner from './pages/TestRunner'
import Results from './pages/Results'
import Documentation from './pages/Documentation'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<TestRunner />} />
          <Route path="/results" element={<Results />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
