import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function TiendaLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<p className="p-10 text-center text-slate-500">Cargando...</p>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}