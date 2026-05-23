import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FileText, Search, Download, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function PublicLibraryPage() {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('id, title, description, mime_type, file_size, created_at, profiles(display_name)')
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      setDocs(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = docs.filter(d =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.description?.toLowerCase().includes(query.toLowerCase())
  )

  function fmtSize(b) {
    if (!b) return ''
    if (b < 1048576) return `${(b/1024).toFixed(0)} KB`
    return `${(b/1048576).toFixed(1)} MB`
  }

  function typeLabel(mime) {
    if (!mime) return 'File'
    if (mime.includes('pdf')) return 'PDF'
    if (mime.includes('word')) return 'Word'
    if (mime.includes('text')) return 'Text'
    if (mime.includes('image')) return 'Image'
    return 'File'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f14]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Public Library</h1>
              <p className="text-slate-500 mt-1">
                {filtered.length} document{filtered.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <Link to="/login" className="btn-primary">Sign in to upload</Link>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search" placeholder="Search documents…" className="input pl-9"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading library…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-slate-500">No documents found{query ? ' for that search' : ''}.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-600/20 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {typeLabel(doc.mime_type)} · {fmtSize(doc.file_size)}
                    </p>
                  </div>
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{doc.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <User size={11} />
                    {doc.profiles?.display_name ?? 'Unknown'}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </span>
                </div>

                <Link to={`/doc/${doc.id}`} className="btn-secondary w-full justify-center text-xs">
                  View document
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
