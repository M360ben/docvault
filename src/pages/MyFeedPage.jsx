import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FileText, Settings, Bookmark, BookmarkCheck, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = {
  'House':             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Apartments':        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Design':            'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Construction':      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Building Materials':'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Renovation':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Vastu':             'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'General':           'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function DocCard({ doc, bookmarked, onBookmark }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-600/20 flex items-center
                          justify-center shrink-0 mt-0.5">
            <FileText size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {doc.title}
            </h3>
            {doc.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onBookmark(doc.id, bookmarked)}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-brand-600
                     hover:bg-brand-50 dark:hover:bg-brand-600/10 transition-colors">
          {bookmarked
            ? <BookmarkCheck size={15} className="text-brand-600" />
            : <Bookmark size={15} />}
        </button>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2
                      border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {doc.category && (
            <span className={`badge text-xs ${CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS['General']}`}>
              {doc.category}
            </span>
          )}
          {doc.is_public && <Globe size={11} className="text-blue-400" />}
        </div>
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
        </span>
      </div>

      <Link to={`/doc/${doc.id}`}
        className="btn-secondary w-full justify-center text-xs py-1.5">
        View document
      </Link>
    </div>
  )
}

export default function MyFeedPage() {
  const { user } = useAuth()
  const [docs,       setDocs]       = useState([])
  const [prefs,      setPrefs]      = useState(null)
  const [bookmarkIds, setBookmarkIds] = useState(new Set())
  const [loading,    setLoading]    = useState(true)
  const [feedLabel,  setFeedLabel]  = useState('')

  useEffect(() => {
    async function load() {
      // Load preferences
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setPrefs(prefsData)

      // Load bookmarks
      const { data: bmsData } = await supabase
        .from('bookmarks')
        .select('document_id')
        .eq('user_id', user.id)
      setBookmarkIds(new Set((bmsData ?? []).map(b => b.document_id)))

      // Build document query
      let query = supabase
        .from('documents')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      const hasCategories = prefsData &&
        !prefsData.use_default &&
        prefsData.categories?.length > 0

      if (hasCategories) {
        query = query.in('category', prefsData.categories)
        setFeedLabel(`Showing: ${prefsData.categories.join(', ')}`)
      } else {
        // Random selection — fetch more then shuffle
        query = query.limit(50)
        setFeedLabel('Showing: Random selection from all categories')
      }

      const { data: docsData } = await query
      let result = docsData ?? []

      // Shuffle for default/random feed
      if (!hasCategories) {
        result = result.sort(() => Math.random() - 0.5).slice(0, 12)
      }

      setDocs(result)
      setLoading(false)
    }
    load()
  }, [user.id])

  async function handleBookmark(docId, isBookmarked) {
    if (isBookmarked) {
      const { error } = await supabase.from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('document_id', docId)
      if (error) { toast.error(error.message); return }
      setBookmarkIds(s => { const n = new Set(s); n.delete(docId); return n })
      toast.success('Bookmark removed')
    } else {
      const { error } = await supabase.from('bookmarks')
        .insert({ user_id: user.id, document_id: docId })
      if (error) { toast.error(error.message); return }
      setBookmarkIds(s => new Set([...s, docId]))
      toast.success('Bookmarked!')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Feed</h1>
          {feedLabel && (
            <p className="text-sm text-slate-500 mt-1">{feedLabel}</p>
          )}
        </div>
        <Link to="/app/profile" className="btn-secondary text-xs shrink-0">
          <Settings size={13} /> Adjust preferences
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading your feed…</div>
      ) : docs.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 mb-2">No documents found for your selected categories.</p>
          <Link to="/app/profile" className="btn-primary mt-2 inline-flex">
            <Settings size={14} /> Update preferences
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              bookmarked={bookmarkIds.has(doc.id)}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  )
}
