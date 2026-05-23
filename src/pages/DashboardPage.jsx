import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Upload, FileText, Clock, CheckCircle, XCircle, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setDocs(data ?? [])
      setLoading(false)
    }
    load()
  }, [user.id])

  const counts = {
    total:    docs.length,
    pending:  docs.filter(d => d.status === 'pending').length,
    approved: docs.filter(d => d.status === 'approved').length,
    rejected: docs.filter(d => d.status === 'rejected').length,
  }

  const statusBadge = s => ({
    pending:  <span className="badge-pending">Pending</span>,
    approved: <span className="badge-approved">Approved</span>,
    rejected: <span className="badge-rejected">Rejected</span>,
  }[s] ?? <span className="badge bg-slate-100 text-slate-600">Unknown</span>)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {profile?.display_name || 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's a summary of your documents.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText}    label="Total uploaded"  value={counts.total}    color="bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400" />
        <StatCard icon={Clock}       label="Pending review"  value={counts.pending}  color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatCard icon={CheckCircle} label="Approved"        value={counts.approved} color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <StatCard icon={XCircle}     label="Rejected"        value={counts.rejected} color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent docs */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent uploads</h2>
            <Link to="/my-documents" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No documents yet.</p>
              <Link to="/upload" className="btn-primary mt-3 inline-flex">Upload your first doc</Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {docs.map(doc => (
                <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText size={16} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.is_public && <Globe size={12} className="text-blue-500" />}
                    {statusBadge(doc.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Link to="/upload" className="btn-primary w-full justify-center">
                <Upload size={14} /> Upload document
              </Link>
              <Link to="/library" className="btn-secondary w-full justify-center">
                <Globe size={14} /> Browse library
              </Link>
            </div>
          </div>
          <div className="card p-5 bg-brand-50 dark:bg-brand-600/10 border-brand-200 dark:border-brand-800">
            <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-1">How it works</h3>
            <ol className="text-xs text-brand-600 dark:text-brand-400 space-y-1.5 list-decimal list-inside">
              <li>Upload your document</li>
              <li>A moderator reviews it</li>
              <li>Once approved, it's accessible</li>
              <li>Set it public or keep it private</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
