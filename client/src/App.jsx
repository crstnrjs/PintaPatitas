import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import routes from './routes'

function Cargando() {
  return <p className="p-10 text-center text-slate-500">Cargando...</p>
}

export default function App() {
  return <Suspense fallback={<Cargando />}>{useRoutes(routes)}</Suspense>
}
