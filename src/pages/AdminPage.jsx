import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Users, Shield, UserCheck, Search, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const ROLES = ['user', 'moderator', 'admin']

export default function AdminPage() {
  const [users,   setUsers]   = useState([])
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [tab,     setTab]     = useState('users')

  // Share-access modal state
  const [shareDoc,   setShareDoc]   = useState(null)
  const [shareEmail, setShareEmail] = useState('')

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data ?? [])
  }

  async function loadDocs() {
    const { data } = await supabase
      .from('documents')
      .select('*, profiles(display_name)')
      .eq('is_public', false)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
  }

  useEffect(() => {
    Promise.all([loadUsers(), loadDocs()]).finally(() => setLoading(false))
  }, [])

  async function changeRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) toast.error(error.message)
    else { toast.success('Role updated'); loadUsers() }
  }

  async function grantAccess() {
    if (!shareEmail.trim()) return
    // Find user by email
    const { data: profile } = await supabase.from('profiles')
      .select('id').eq('email', shareEmail.trim()).single()
    if (!profile) { toast.error('User not found'); return }

    const { error } = await supabase.from('doc_access').upsert({
      document_id: shareDoc.id,
      user_id: profile.id,
      granted_by: (await supabase.auth.getUser()).data.user.id
    })
    if (error) toast.error(error.message)
    else { toast.success('Access granted'); setShareDoc(null); setShareEmail('') }
  }

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  )

  const roleColor = r => ({
    admin:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    user:      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }[r] ?? '')

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin panel</h1>
        <p className="text-slate-500 mt-1">Manage users, roles, and document access.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total users', value: users.length, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { icon: Shield, label: 'Moderators', value: users.filter(u => u.role === 'moderator').length, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
          { icon: UserCheck, label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-6">
        {['users', 'access'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {t === 'users' ? 'User management' : 'Document access'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search users…"
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-600/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm shrink-0">
                  {(u.display_name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {u.display_name || '—'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className={`badge ${roleColor(u.role)} capitalize`}>{u.role}</span>
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'access' && (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {docs.length === 0 && (
            <div className="p-10 text-center text-slate-500 text-sm">No private approved documents.</div>
          )}
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.title}</p>
                <p className="text-xs text-slate-400">by {doc.profiles?.display_name ?? '?'}</p>
              </div>
              <button onClick={() => setShareDoc(doc)}
                className="btn-secondary text-xs py-1 px-2.5">
                <Share2 size={12} /> Grant access
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Grant access modal */}
      {shareDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Grant access</h3>
            <p className="text-xs text-slate-500 mb-4">Allow a user to view "{shareDoc.title}"</p>
            <input className="input mb-3" type="email" placeholder="User's email address"
              value={shareEmail} onChange={e => setShareEmail(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={grantAccess} className="btn-primary flex-1 justify-center">Grant</button>
              <button onClick={() => { setShareDoc(null); setShareEmail('') }}
                className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
