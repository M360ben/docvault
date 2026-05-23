import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, XCircle, Download, Eye, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TABS = ['pending', 'approved', 'rejected']

export default function ModerationPage() {
  const { user } = useAuth()
  const [docs,    setDocs]    = useState([])
  const [tab,     setTab]     = useState('pending')
  const [loading, setLoading] = useState(true)
  const [notes,   setNotes]   = useState({})

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*, profiles(display_name, email)')
      .eq('status', tab)
      .order('created_at', { ascending: true })
    if (error) toast.error(error.message)
    else setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  async function decide(doc, status) {
    const note = notes[doc.id] ?? ''
    // Update document status
    const { error: docErr } = await supabase.from('documents')
      .update({ status, moderated_by: user.id, moderated_at: new Date().toISOString() })
      .eq('id', doc.id)
    if (docErr) { toast.error(docErr.message); return }

    // Log review
    await supabase.from('mod_reviews').insert({
      document_id:  doc.id,
      reviewer_id:  user.id,
      decision:     status,
      notes:        note || null
    })

    toast.success(`Document ${status}`)
    setNotes(n => { const x = { ...n }; delete x[doc.id]; return x })
    load()
  }

  async function getPreviewUrl(doc) {
    const { data } = await supabase.storage.from('documents')
      .createSignedUrl(doc.file_path, 300)
    if (data) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderation queue</h1>
        <p className="text-slate-500 mt-1">Review uploaded documents before they become accessible.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="card p-16 text-center">
          <Clock size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500">No {tab} documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => (
            <div key={doc.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{doc.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By {doc.profiles?.display_name ?? doc.profiles?.email ?? 'Unknown'} ·{' '}
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button onClick={() => getPreviewUrl(doc)}
                      className="btn-secondary shrink-0 text-xs py-1 px-2.5">
                      <Eye size={13} /> Preview
                    </button>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {/* Moderator note */}
                  {tab === 'pending' && (
                    <div className="mt-3">
                      <textarea
                        className="input resize-none h-16 text-xs"
                        placeholder="Optional note (visible in audit log)…"
                        value={notes[doc.id] ?? ''}
                        onChange={e => setNotes(n => ({ ...n, [doc.id]: e.target.value }))}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => decide(doc, 'approved')}
                          className="btn bg-green-600 text-white hover:bg-green-700 active:scale-95 flex-1 justify-center text-xs">
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button onClick={() => decide(doc, 'rejected')}
                          className="btn-danger flex-1 justify-center text-xs">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show review info for non-pending */}
                  {tab !== 'pending' && doc.moderated_at && (
                    <p className="text-xs text-slate-400 mt-2">
                      {tab === 'approved' ? '✓ Approved' : '✗ Rejected'}{' '}
                      {formatDistanceToNow(new Date(doc.moderated_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
