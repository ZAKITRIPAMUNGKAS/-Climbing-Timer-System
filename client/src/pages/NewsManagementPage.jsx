import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, Search, Edit, Trash2, AlertCircle, CheckCircle2, X, Calendar, Tag } from 'lucide-react'
import ReactQuill from 'react-quill'
import DOMPurify from 'dompurify'
import Swal from 'sweetalert2'
import 'react-quill/dist/quill.snow.css'

function NewsManagementPage() {
  const [news, setNews] = useState([])
  const [filteredNews, setFilteredNews] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingNews, setEditingNews] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editForm, setEditForm] = useState({ 
    title: '', 
    category: '', 
    color: 'crimson', 
    date: '', 
    description: '' 
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const quillRef = useRef(null)

  useEffect(() => {
    fetchNews()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNews(news)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredNews(
        news.filter(article =>
          article.title?.toLowerCase().includes(query) ||
          article.category?.toLowerCase().includes(query) ||
          article.description?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, news])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/news')
      if (response.ok) {
        const data = await response.json()
        setNews(data)
        setFilteredNews(data)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setMessage({ type: 'error', text: 'Gagal memuat data berita' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Berita?',
      text: 'Data berita akan dihapus permanen',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Berita berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        })
        fetchNews()
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Gagal menghapus berita'
        })
      }
    } catch (error) {
      console.error('Error deleting news:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat menghapus'
      })
    }
  }

  // Helper function to strip HTML tags and convert to plain text
  // Converts <p> tags to line breaks, strips other HTML
  const stripHtmlTags = (html) => {
    if (!html) return ''
    // First, replace <p> tags with line breaks
    let text = html
      .replace(/<p[^>]*>/gi, '\n')  // Replace opening <p> tags with newline
      .replace(/<\/p>/gi, '')       // Remove closing </p> tags
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newline
      .replace(/&nbsp;/gi, ' ')     // Replace &nbsp; with space
      .replace(/&amp;/gi, '&')      // Replace &amp; with &
      .replace(/&lt;/gi, '<')       // Replace &lt; with <
      .replace(/&gt;/gi, '>')        // Replace &gt; with >
      .replace(/&quot;/gi, '"')     // Replace &quot; with "
      .replace(/&#39;/gi, "'")      // Replace &#39; with '
    
    // Strip remaining HTML tags
    const tmp = document.createElement('DIV')
    tmp.innerHTML = text
    text = tmp.textContent || tmp.innerText || ''
    
    // Clean up multiple consecutive newlines
    text = text.replace(/\n{3,}/g, '\n\n')
    
    return text.trim()
  }


  const handleEdit = (article) => {
    setEditingNews(article)
    setEditForm({
      title: article.title || '',
      category: article.category || '',
      color: article.color || 'crimson',
      date: article.date || '',
      description: article.description || ''
    })
    setSelectedImage(null)
    setImagePreview(article.image ? `${window.location.origin}${article.image}` : null)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingNews(null)
    setEditForm({ 
      title: '', 
      category: '', 
      color: 'crimson', 
      date: '', 
      description: '' 
    })
    setSelectedImage(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP' })
        e.target.value = '' // Clear input
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' })
        e.target.value = '' // Clear input
        return
      }
      
      // Additional security: check file name for dangerous patterns
      const dangerousPatterns = /[<>:"|?*\x00-\x1f]/g
      if (dangerousPatterns.test(file.name)) {
        setMessage({ type: 'error', text: 'Nama file tidak valid' })
        e.target.value = '' // Clear input
        return
      }
      
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Clear any previous error messages
      setMessage({ type: '', text: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!editForm.title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Judul wajib diisi',
        text: 'Mohon isi judul berita'
      })
      return
    }
    
    if (editForm.title.trim().length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Judul terlalu pendek',
        text: 'Judul berita minimal 10 karakter'
      })
      return
    }

    if (editForm.title.trim().length > 200) {
      Swal.fire({
        icon: 'warning',
        title: 'Judul terlalu panjang',
        text: 'Judul berita maksimal 200 karakter'
      })
      return
    }
    
    if (!editForm.category.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Kategori wajib diisi',
        text: 'Mohon isi kategori berita'
      })
      return
    }

    if (editForm.category.trim().length > 50) {
      Swal.fire({
        icon: 'warning',
        title: 'Kategori terlalu panjang',
        text: 'Kategori maksimal 50 karakter'
      })
      return
    }
    
    if (!editForm.date) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanggal wajib diisi',
        text: 'Mohon pilih tanggal berita'
      })
      return
    }

    // Validate description/content
    const plainTextContent = editForm.description 
      ? editForm.description.replace(/<[^>]*>/g, '').trim() 
      : ''
    
    if (plainTextContent.length < 50) {
      Swal.fire({
        icon: 'warning',
        title: 'Konten terlalu pendek',
        text: 'Deskripsi/Konten berita minimal 50 karakter'
      })
      return
    }

    if (plainTextContent.length > 50000) {
      Swal.fire({
        icon: 'warning',
        title: 'Konten terlalu panjang',
        text: 'Deskripsi/Konten berita maksimal 50.000 karakter'
      })
      return
    }

    if (!editingNews && !selectedImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Gambar wajib diupload',
        text: 'Gambar wajib diupload untuk berita baru'
      })
      return
    }

    // Final sanitization before sending to server
    const sanitizedDescription = DOMPurify.sanitize(editForm.description, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'blockquote', 'div', 'span',
        'table', 'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'class'
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false
    })

    setIsSubmitting(true)

    try {
      let response
      if (selectedImage) {
        const formData = new FormData()
        formData.append('title', editForm.title.trim())
        formData.append('category', editForm.category.trim())
        formData.append('color', editForm.color)
        formData.append('date', editForm.date)
        formData.append('description', sanitizedDescription)
        formData.append('image', selectedImage)
        if (editingNews && editingNews.image) {
          formData.append('existingImage', editingNews.image)
        }

        const endpoint = editingNews 
          ? `/api/news/${editingNews.id}`
          : '/api/news'
        
        response = await fetch(endpoint, {
          method: editingNews ? 'PUT' : 'POST',
          credentials: 'include',
          body: formData
        })
      } else {
        // Update without new image
        response = await fetch(`/api/news/${editingNews.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            title: editForm.title.trim(),
            category: editForm.category.trim(),
            color: editForm.color,
            date: editForm.date,
            description: sanitizedDescription,
            existingImage: editingNews.image || null
          })
        })
      }

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: editingNews ? 'Berita berhasil diperbarui' : 'Berita berhasil ditambahkan',
          timer: 2000,
          showConfirmButton: false
        })
        setShowModal(false)
        setSelectedImage(null)
        setImagePreview(null)
        setEditingNews(null)
        setEditForm({ title: '', category: '', color: 'crimson', date: '', description: '' })
        fetchNews()
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Gagal menyimpan berita'
        })
      }
    } catch (error) {
      console.error('Error saving news:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat menyimpan berita'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const colorOptions = [
    { value: 'crimson', label: 'Merah', class: 'bg-red-500' },
    { value: 'blue', label: 'Biru', class: 'bg-blue-500' },
    { value: 'green', label: 'Hijau', class: 'bg-green-500' },
    { value: 'yellow', label: 'Kuning', class: 'bg-yellow-500' },
    { value: 'purple', label: 'Ungu', class: 'bg-purple-500' },
    { value: 'orange', label: 'Oranye', class: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Berita</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola berita dan artikel</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold"
          >
            <Plus size={18} />
            <span>Tambah Berita</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari berita berdasarkan judul, kategori, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Menampilkan {filteredNews.length} dari {news.length} berita
        </div>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Gambar</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada berita yang sesuai dengan pencarian' : 'Belum ada data berita'}
                  </td>
                </tr>
              ) : (
                filteredNews.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {article.image ? (
                        <img
                          src={`${window.location.origin}${article.image}`}
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23E11D23%22 width=%2264%22 height=%2264%22/%3E%3Ctext fill=%22%23FFFFFF%22 font-family=%22Arial%22 font-size=%2210%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">{article.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.color === 'crimson' ? 'bg-red-100 text-red-800' :
                        article.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        article.color === 'green' ? 'bg-green-100 text-green-800' :
                        article.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        article.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        article.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {article.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <div className="truncate" title={stripHtmlTags(article.description)}>
                        {stripHtmlTags(article.description) || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(article)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Berita"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingNews ? 'Edit Berita' : 'Tambah Berita'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedImage(null)
                  setImagePreview(null)
                  setEditingNews(null)
                  setEditForm({ title: '', category: '', color: 'crimson', date: '', description: '' })
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gambar Berita {!editingNews && <span className="text-red-500">*</span>}
                </label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {selectedImage && (
                    <p className="text-xs text-gray-600">
                      File dipilih: {selectedImage.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Berita <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul berita"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: Olahraga, Event"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Warna Badge
                  </label>
                  <select
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi / Konten Berita <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={editForm.description}
                    onChange={(value) => {
                      // Store the value directly, sanitization will be done on submit
                      // Sanitizing on every keystroke can cause UX issues
                      setEditForm({ ...editForm, description: value })
                    }}
                    ref={quillRef}
                    placeholder="Masukkan deskripsi berita... (Minimal 50 karakter)"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['link'],
                        ['clean']
                      ],
                      clipboard: {
                        matchVisual: false
                      }
                    }}
                    formats={[
                      'header',
                      'bold', 'italic', 'underline', 'strike',
                      'list', 'bullet',
                      'align',
                      'link'
                    ]}
                    style={{ 
                      minHeight: '350px',
                      backgroundColor: 'white'
                    }}
                    bounds="self"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Gunakan toolbar untuk memformat teks. HTML berbahaya akan otomatis dihapus.
                  </p>
                  <p className={`text-xs font-medium ${
                    editForm.description && editForm.description.replace(/<[^>]*>/g, '').trim().length >= 50
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {editForm.description 
                      ? `${editForm.description.replace(/<[^>]*>/g, '').trim().length} karakter`
                      : '0 karakter'} / Minimal 50 karakter
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedImage(null)
                    setImagePreview(null)
                    setEditingNews(null)
                    setEditForm({ title: '', category: '', color: 'crimson', date: '', description: '' })
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingNews ? 'Simpan Perubahan' : 'Tambah Berita'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsManagementPage

