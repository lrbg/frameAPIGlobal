import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import LoadingSpinner from '../components/LoadingSpinner'
import { staticApi, api } from '../services/api'

export default function Documentation() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Try static file first (GitHub Pages), fallback to live backend
    staticApi.getSwagger()
      .then(setSpec)
      .catch(() => api.getSwagger().then(setSpec))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading API documentation..." />

  if (error || !spec) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-300 font-medium">Documentation unavailable</p>
        <p className="text-gray-500 text-sm mt-2">
          The Swagger spec will be auto-generated when you run tests via GitHub Actions or locally.
        </p>
        {error && <p className="text-xs text-red-400 font-mono mt-3">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">API Documentation</h1>
        <p className="text-gray-400 text-sm mt-1">
          Auto-generated from Bruno test collections · OpenAPI 3.0
        </p>
      </div>
      <div className="card p-0 overflow-hidden">
        <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={-1} />
      </div>
    </div>
  )
}
