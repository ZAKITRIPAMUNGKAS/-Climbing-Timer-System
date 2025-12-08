import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * OverlayLayout Component for OBS Browser Source
 * 
 * Features:
 * - Transparent background (crucial for OBS)
 * - No navbar, footer, or padding
 * - High readability fonts with text-shadow
 * - Green screen support via ?chroma=true query param
 */
function OverlayLayout({ children }) {
  const [searchParams] = useSearchParams()
  const chromaKey = searchParams.get('chroma') === 'true'

  useEffect(() => {
    // Apply overlay-specific styles to html and body
    const html = document.documentElement
    const body = document.body

    // Set transparent background
    html.style.backgroundColor = chromaKey ? '#00FF00' : 'transparent'
    body.style.backgroundColor = chromaKey ? '#00FF00' : 'transparent'
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    // Cleanup on unmount
    return () => {
      html.style.backgroundColor = ''
      body.style.backgroundColor = ''
      html.style.overflow = ''
      body.style.overflow = ''
    }
  }, [chromaKey])

  return (
    <div 
      className="overlay-container"
      style={{
        backgroundColor: chromaKey ? '#00FF00' : 'transparent',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </div>
  )
}

export default OverlayLayout

