import Navbar from './Navbar'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  )
}

export default PublicLayout

