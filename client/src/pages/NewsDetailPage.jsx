import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Calendar, Tag, Share2, Facebook, Twitter, MessageCircle, Copy, Check, Clock, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import PublicLayout from '../components/PublicLayout'
import ErrorBoundary from '../components/ErrorBoundary'
import './LandingPage.css'
import './NewsDetailPage.css'

function NewsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [allNews, setAllNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://fptikaranganyar.my.id/logo.jpeg'
    
    const baseUrl = 'https://fptikaranganyar.my.id'
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    } else if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`
    } else {
      return `${baseUrl}/uploads/${imagePath}`
    }
  }

  // Helper function to sanitize HTML content
  const sanitizeHtml = (html) => {
    if (!html) return ''
    
    try {
      // Configure DOMPurify to allow safe HTML tags and attributes
      const config = {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'div', 'span',
          'table', 'thead', 'tbody', 'tr', 'td', 'th'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'alt', 'src', 'class', 'style', 'target', 'rel'
        ],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false
      }
      
      // Sanitize the HTML
      const sanitized = DOMPurify.sanitize(html, config)
      
      // Additional cleanup: remove any remaining script tags and event handlers
      return sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
    } catch (error) {
      console.error('Error sanitizing HTML:', error)
      // If sanitization fails, return plain text
      return html.replace(/<[^>]*>/g, '')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch article and all news in parallel
        const [articleRes, newsRes] = await Promise.all([
          fetch(`/api/news/${id}`),
          fetch('/api/news')
        ])
        
        if (articleRes.ok) {
          const data = await articleRes.json()
          setArticle(data)
        } else if (articleRes.status === 404) {
          setError('Berita tidak ditemukan')
        } else {
          setError('Gagal memuat berita')
        }
        
        if (newsRes.ok) {
          const newsData = await newsRes.json()
          // Filter out current article and get top 3 recommendations
          const recommendations = newsData
            .filter(n => n.id !== parseInt(id))
            .slice(0, 3)
          setAllNews(recommendations)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Terjadi kesalahan saat memuat berita')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleShare = async (platform) => {
    const articleUrl = `${window.location.origin}/berita/${article.id}`
    const shareText = article.title

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + articleUrl)}`, '_blank')
        break
      case 'copy':
        try {
          await navigator.clipboard.writeText(articleUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = articleUrl
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
        break
      default:
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareText,
              text: article.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
              url: articleUrl
            })
          } catch (err) {
            // User cancelled or error
          }
        }
    }
  }

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <PublicLayout>
        <div className="bg-[#0a0a0a] min-h-screen text-zinc-200 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800] mb-4"></div>
            <div className="text-xl font-bold mb-2 text-[#FFB800] tracking-wider">LOADING ARTICLE</div>
            <p className="text-zinc-500 text-sm tracking-widest uppercase">Please wait</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="bg-[#0a0a0a] min-h-screen text-zinc-200 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-[#111111] border border-zinc-800 p-10 shadow-2xl rounded-sm">
              <h2 className="text-2xl font-black text-white mb-4 uppercase">{error || 'Article Not Found'}</h2>
              <Link
                to="/berita"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFB800] text-black font-bold uppercase tracking-wider hover:bg-[#e6a600] transition-colors rounded-sm"
              >
                <ArrowLeft size={18} />
                Back to News
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // Get meta data
  const baseUrl = 'https://fptikaranganyar.my.id'
  const articleUrl = article ? `${baseUrl}/berita/${article.id}` : ''
  const imageUrl = article ? getImageUrl(article.image) : `${baseUrl}/logo.jpeg`
  const description = article
    ? (article.description ? article.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Berita dari FPTI Karanganyar')
    : 'Berita dari FPTI Karanganyar'

  // --- MAIN RENDER ---

  return (
    <ErrorBoundary>
      <PublicLayout>
        {article && (
        <Helmet>
          <title>{article.title} - FPTI Karanganyar</title>
          <meta name="description" content={description} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="article" />
          <meta property="og:url" content={articleUrl} />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:secure_url" content={imageUrl} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:site_name" content="FPTI Karanganyar" />
          <meta property="og:locale" content="id_ID" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={articleUrl} />
          <meta name="twitter:title" content={article.title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={imageUrl} />
          
          {/* Additional */}
          <meta name="article:published_time" content={article.date || new Date().toISOString()} />
        </Helmet>
      )}
      <div className="bg-[#0a0a0a] min-h-screen text-zinc-200 font-sans selection:bg-[#FFB800] selection:text-black pt-24">
        
        {/* Navigation Bar Area (Sticky Back Button) */}
        <div className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800 py-4 mb-8">
           <div className="container mx-auto px-6">
              <Link
                to="/berita"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#FFB800] transition-colors text-sm font-bold uppercase tracking-wider group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to News</span>
              </Link>
           </div>
        </div>

        {/* Article Container */}
        <article className="container mx-auto px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header Section */}
            <header className="mb-10">
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <span className={`inline-block px-3 py-1 bg-[#FFB800] text-black font-black uppercase tracking-widest text-xs`}>
                  {article.category || 'News'}
                </span>
                <span className="text-zinc-500 font-medium flex items-center gap-2">
                  <Calendar size={14} />
                  {article.date}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
                {article.title}
              </h1>
              
              {/* Share Bar */}
              <div className="flex items-center gap-4 py-4 border-y border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-2">Share:</span>
                <div className="flex gap-2">
                    <button onClick={() => handleShare('facebook')} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-[#1877F2] transition-all" title="Facebook">
                        <Facebook size={18} />
                    </button>
                    <button onClick={() => handleShare('twitter')} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-[#1DA1F2] transition-all" title="Twitter">
                        <Twitter size={18} />
                    </button>
                    <button onClick={() => handleShare('whatsapp')} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-[#25D366] transition-all" title="WhatsApp">
                        <MessageCircle size={18} />
                    </button>
                    <button onClick={() => handleShare('copy')} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all relative" title="Copy Link">
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.image && (
              <div className="mb-12 relative group overflow-hidden bg-[#111111] border border-zinc-800">
                <img 
                  src={article.image.startsWith('http') ? article.image : `${window.location.origin}${article.image}`}
                  alt={article.title || 'News image'}
                  className="w-full h-auto object-cover max-h-[600px]"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null // Prevent infinite loop
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23111111" width="800" height="600"/%3E%3Ctext fill="%23333333" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EIMAGE NOT AVAILABLE%3C/text%3E%3C/svg%3E`
                  }}
                  onLoad={(e) => {
                    // Validate image loaded successfully
                    if (e.target.naturalWidth === 0 || e.target.naturalHeight === 0) {
                      e.target.onerror()
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-20"></div>
              </div>
            )}

            {/* Content Body */}
            <ErrorBoundary>
              <div 
                className="article-content"
              >
                <div 
                  className="leading-relaxed font-light article-content-inner"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(article.description || '<p>Tidak ada konten yang tersedia.</p>')
                  }}
                />
              </div>
            </ErrorBoundary>
          </motion.div>
        </article>

        {/* Recommended News Section */}
        {allNews.length > 0 && (
          <section className="bg-[#111111] border-t border-zinc-800 py-16">
            <div className="container mx-auto px-6 max-w-6xl">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-1 h-8 bg-[#FFB800]"></div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">Berita Lainnya</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {allNews.map((newsItem, index) => (
                  <motion.div
                    key={newsItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => navigate(`/berita/${newsItem.id}`)}
                    className="group bg-[#0a0a0a] border border-zinc-800 hover:border-[#FFB800]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={newsItem.image && newsItem.image.startsWith('http') ? newsItem.image : (newsItem.image ? newsItem.image : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23111111" width="800" height="600"/%3E%3Ctext fill="%23333333" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E')}
                        alt={newsItem.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23111111" width="800" height="600"/%3E%3Ctext fill="%23333333" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(newsItem.category || 'News')}%3C/text%3E%3C/svg%3E`
                        }}
                      />
                      <div className="absolute top-3 left-3">
                         <span className="bg-[#0a0a0a]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider border border-zinc-700">
                            {newsItem.category}
                         </span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                        <Clock size={12} />
                        <span>{newsItem.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3 leading-tight group-hover:text-[#FFB800] transition-colors line-clamp-2">
                        {newsItem.title}
                      </h3>
                      <div className="mt-auto pt-4 border-t border-zinc-900 flex items-center text-[#FFB800] text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0 transform">
                        Read Article <ChevronRight size={14} className="ml-1" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 bg-[#0a0a0a] text-center border-t border-zinc-900">
          <div className="container mx-auto px-6">
            <p className="text-zinc-600 text-sm">
              &copy; {new Date().getFullYear()} FPTI Karanganyar. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      </PublicLayout>
    </ErrorBoundary>
  )
}

export default NewsDetailPage