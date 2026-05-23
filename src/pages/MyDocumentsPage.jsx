import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Download, Trash2, Globe, Lock, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function MyDocumentsPage() {
  const { user } = useAuth()
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user.id])

  async function togglePublic(doc) {
    if (doc.status !== 'approved') { toast.error('Document must be approved before changing visibility'); return }
    const { error } = await supabase.from('documents')
      .update({ is_public: !doc.is_public }).eq('id', doc.id)
    if (error) toast.error(error.message)
    else { toast.success('Visibility updated'); load() }
  }

  async function deleteDoc(doc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    const { error: storageErr } = await supabase.storage.from('documents').remove([doc.file_path])
    if (storageErr) { toast.error(storageErr.message); return }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) toast.error(error.message)
    else { toast.success('Document deleted'); load() }
  }

  async function getDownloadUrl(doc) {
    const { data, error } = await supabase.storage.from('documents')
      .createSignedUrl(doc.file_path, 3600)
    if (error) { toast.error(error.message); return }
    window.open(data.signedUrl, '_blank')
  }

  const statusBadge = s => ({
    pending:  <span className="badge-pending">Pending review</span>,
    approved: <span className="badge-approved">Approved</span>,
    rejected: <span className="badge-rejected">Rejected</span>,
  }[s])

  function fmtSize(b) {
    if (b < 1048576) return `${(b/1024).toFixed(0)} KB`
    return `${(b/1048576).toFixed(1)} MB`
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My documents</h1>
          <p className="text-slate-500 mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500">You haven't uploaded any documents yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{fmtSize(doc.file_size)}</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(doc.status)}

                {doc.status === 'approved' && (
                  <button onClick={() => togglePublic(doc)}
                    title={doc.is_public ? 'Make private' : 'Make public'}
                    className={`p-1.5 rounded-lg transition-colors
                      ${doc.is_public
                        ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {doc.is_public ? <Globe size={15} /> : <Lock size={15} />}
                  </button>
                )}

                <button onClick={() => getDownloadUrl(doc)} title="Download"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-600/10 transition-colors">
                  <Download size={15} />
                </button>

                <button onClick={() => deleteDoc(doc)} title="Delete"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
