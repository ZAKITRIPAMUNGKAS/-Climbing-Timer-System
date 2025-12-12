import React from 'react'
import { AlertCircle, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-[#111111] border border-zinc-800 rounded-lg p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white mb-1">Terjadi Kesalahan</h1>
                <p className="text-zinc-400 text-sm">Halaman tidak dapat dimuat dengan benar</p>
              </div>
            </div>
            
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-zinc-300 text-sm mb-2">
                Kemungkinan penyebab:
              </p>
              <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1 ml-2">
                <li>Konten berita mengandung format HTML yang tidak valid</li>
                <li>Gambar yang terlalu besar atau format tidak didukung</li>
                <li>Kesalahan pada server saat memuat data</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6">
                <summary className="text-sm text-zinc-400 cursor-pointer mb-2">
                  Detail Error (Development Only)
                </summary>
                <pre className="bg-[#0a0a0a] border border-zinc-800 rounded p-4 text-xs text-red-400 overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#FFB800] text-black font-bold uppercase tracking-wider hover:bg-[#e6a600] transition-colors rounded-sm"
              >
                Muat Ulang Halaman
              </button>
              <Link
                to="/berita"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors rounded-sm"
              >
                <Home size={18} />
                Kembali ke Berita
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

