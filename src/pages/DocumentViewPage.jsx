import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, ArrowLeft, Lock, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DocumentViewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [doc,     setDoc]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles(display_name, id)')
        .eq('id', id)
        .single()

      if (error || !data) { setError('Document not found.'); setLoading(false); return }

      // Access checks
      if (data.status !== 'approved') {
        if (!user || user.id !== data.uploaded_by) {
          setError('This document is not yet approved.'); setLoading(false); return
        }
      }

      if (!data.is_public) {
        if (!user) { setError('This document is private. Please sign in.'); setLoading(false); return }
        if (user.id !== data.uploaded_by) {
          // Check doc_access table
          const { data: access } = await supabase
            .from('doc_access')
            .select('id')
            .eq('document_id', id)
            .eq('user_id', user.id)
            .single()
          if (!access) { setError('You don\'t have access to this document.'); setLoading(false); return }
        }
      }

      setDoc(data)
      setLoading(false)
    }
    load()
  }, [id, user])

  async function download() {
    const { data, error } = await supabase.storage.from('documents')
      .createSignedUrl(doc.file_path, 3600)
    if (error) { toast.error('Failed to get download link'); return }
    window.open(data.signedUrl, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0f14]">
      <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0f14] p-4">
      <div className="card p-10 text-center max-w-sm w-full">
        <Lock size={36} className="mx-auto text-slate-300 mb-4" />
        <h2 className="font-semibold text-slate-900 dark:text-white mb-2">Access denied</h2>
        <p className="text-sm text-slate-500 mb-5">{error}</p>
        <Link to="/library" className="btn-primary">Back to library</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f14]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </Link>

        <div className="card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-600/20 flex items-center justify-center shrink-0">
              <FileText size={22} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <User size={12} /> {doc.profiles?.display_name ?? 'Unknown'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar size={12} /> {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </div>
                {doc.is_public
                  ? <span className="badge-public">Public</span>
                  : <span className="badge-private">Private</span>}
              </div>
            </div>
          </div>

          {doc.description && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">{doc.description}</p>
            </div>
          )}

          <button onClick={download} className="btn-primary">
            <Download size={15} /> Download document
          </button>
        </div>
      </div>
    </div>
  )
}
