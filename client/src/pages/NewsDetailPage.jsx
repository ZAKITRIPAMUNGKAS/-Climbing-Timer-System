import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Calendar, Tag, Share2, Facebook, Twitter, MessageCircle, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import PublicLayout from '../components/PublicLayout'
import './LandingPage.css'

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

  if (loading) {
    return (
      <PublicLayout>
        <div className="bg-rich-black min-h-screen text-off-white font-body flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-goldenrod mb-4"></div>
            <div className="text-xl font-semibold text-goldenrod">Memuat berita...</div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="bg-rich-black min-h-screen text-off-white font-body">
          <div className="container mx-auto px-6 py-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{error || 'Berita tidak ditemukan'}</h2>
              <Link
                to="/berita"
                className="inline-flex items-center gap-2 px-6 py-3 bg-goldenrod text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              >
                <ArrowLeft size={18} />
                Kembali ke Berita
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

  return (
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
      <div className="bg-rich-black min-h-screen text-off-white font-body">
        {/* Back Button */}
        <div className="container mx-auto px-6 pt-32 pb-8">
          <Link
            to="/berita"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-goldenrod transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Berita</span>
          </Link>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header - Left Aligned */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className={`inline-block px-4 py-2 ${
                  article.color === 'crimson' 
                    ? 'bg-crimson/20 text-crimson' 
                    : 'bg-goldenrod/20 text-goldenrod'
                } text-sm rounded-full font-bold`}>
                  {article.category}
                </span>
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Calendar size={16} />
                  {article.date}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 text-white leading-tight text-left">
                {article.title}
              </h1>
              
              {/* Share Buttons */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className="text-sm text-gray-400 mr-2">Bagikan:</span>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Share ke Facebook"
                >
                  <Facebook size={18} />
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                  title="Share ke Twitter"
                >
                  <Twitter size={18} />
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="Share ke WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  title="Copy link"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                {navigator.share && (
                  <button
                    onClick={() => handleShare('native')}
                    className="p-2 bg-goldenrod text-black rounded-lg hover:bg-yellow-500 transition-colors"
                    title="Share"
                  >
                    <Share2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Featured Image - Centered */}
            {article.image && (
              <div className="mb-12 rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src={article.image.startsWith('http') ? article.image : `${window.location.origin}${article.image}`}
                  alt={article.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(article.category || 'News')}%3C/text%3E%3C/svg%3E`
                  }}
                />
              </div>
            )}

            {/* Content - Justified with paragraph spacing and indentation */}
            <div className="text-left">
              <div 
                className="news-content text-gray-300 leading-relaxed text-lg md:text-xl max-w-4xl"
                dangerouslySetInnerHTML={{ 
                  __html: (article.description || 'Tidak ada konten')
                }}
              />
            </div>
          </motion.div>
        </article>

        {/* Recommended News Section */}
        {allNews.length > 0 && (
          <section className="container mx-auto px-6 pb-20">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-8 text-center">
                  Berita Lainnya
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allNews.map((newsItem, index) => (
                    <motion.div
                      key={newsItem.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      onClick={() => navigate(`/berita/${newsItem.id}`)}
                      className="bg-gunmetal rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer group"
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={newsItem.image && newsItem.image.startsWith('http') ? newsItem.image : (newsItem.image ? newsItem.image : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E')}
                          alt={newsItem.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23E11D23" width="800" height="600"/%3E%3Ctext fill="%23FFFFFF" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(newsItem.category || 'News')}%3C/text%3E%3C/svg%3E`
                          }}
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-3 py-1 ${
                            newsItem.color === 'crimson' 
                              ? 'bg-crimson/20 text-crimson' 
                              : 'bg-goldenrod/20 text-goldenrod'
                          } text-xs rounded-full font-bold`}>
                            {newsItem.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {newsItem.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-heading font-bold mb-2 text-white group-hover:text-goldenrod transition-colors line-clamp-2">
                          {newsItem.title}
                        </h3>
                        <div className="text-gray-400 text-sm leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ 
                          __html: newsItem.description ? newsItem.description.substring(0, 120) + '...' : 'Tidak ada deskripsi'
                        }}></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-10 border-t border-white/10 text-center text-gray-500 text-sm bg-rich-black">
          <div className="container mx-auto px-6">
            <p>&copy; 2024 FPTI Karanganyar. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PublicLayout>
  )
}

export default NewsDetailPage

