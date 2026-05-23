import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Bell, Shield, Bookmark, FolderOpen,
  Camera, Save, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

const CATEGORIES = [
  'House', 'Apartments', 'Design', 'Construction',
  'Building Materials', 'Renovation', 'Vastu', 'General'
]

const TABS = [
  { id: 'profile',       icon: User,     label: 'Profile' },
  { id: 'preferences',   icon: Bell,     label: 'Preferences' },
  { id: 'notifications', icon: Bell,     label: 'Notifications' },
  { id: 'security',      icon: Shield,   label: 'Security' },
  { id: 'documents',     icon: FolderOpen, label: 'My Documents' },
  { id: 'bookmarks',     icon: Bookmark, label: 'My Bookmarks' },
]

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [tab,        setTab]       = useState('profile')
  const [saving,     setSaving]    = useState(false)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [bio,         setBio]         = useState('')
  const [avatarFile,  setAvatarFile]  = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Preferences
  const [prefs,       setPrefs]    = useState(null)
  const [selCats,     setSelCats]  = useState([])
  const [useDefault,  setUseDefault] = useState(true)

  // Notifications
  const [notifyApproval,    setNotifyApproval]    = useState(true)
  const [notifyShared,      setNotifyShared]      = useState(true)
  const [notifyNewsletter,  setNotifyNewsletter]  = useState(false)

  // Security
  const [newPassword,    setNewPassword]    = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Documents & bookmarks
  const [myDocs,      setMyDocs]     = useState([])
  const [bookmarks,   setBookmarks]  = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [bmsLoading,  setBmsLoading]  = useState(false)

  // Load profile data
  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name || '')
    setBio(profile.bio || '')
    setAvatarPreview(profile.avatar_url || null)
  }, [profile])

  // Load preferences
  useEffect(() => {
    async function loadPrefs() {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setPrefs(data)
        setSelCats(data.categories || [])
        setUseDefault(data.use_default)
        setNotifyApproval(data.notify_approval)
        setNotifyShared(data.notify_shared)
        setNotifyNewsletter(data.notify_newsletter)
      }
    }
    loadPrefs()
  }, [user.id])

  // Load documents when tab opens
  useEffect(() => {
    if (tab === 'documents' && myDocs.length === 0) {
      setDocsLoading(true)
      supabase.from('documents').select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setMyDocs(data ?? []); setDocsLoading(false) })
    }
    if (tab === 'bookmarks' && bookmarks.length === 0) {
      setBmsLoading(true)
      supabase.from('bookmarks')
        .select('*, documents(id, title, category, status, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setBookmarks(data ?? []); setBmsLoading(false) })
    }
  }, [tab])

  // Avatar file selection
  function handleAvatarChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { toast.error('Avatar must be under 2MB'); return }
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  // Save profile
  async function saveProfile() {
    setSaving(true)
    try {
      let avatarUrl = profile?.avatar_url

      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim(),
        bio:          bio.trim() || null,
        avatar_url:   avatarUrl
      }).eq('id', user.id)
      if (error) throw error

      await refreshProfile()
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save preferences
  async function savePreferences() {
    setSaving(true)
    const { error } = await supabase.from('user_preferences').upsert({
      user_id:     user.id,
      categories:  selCats,
      use_default: useDefault,
    })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Preferences saved')
  }

  // Save notifications
  async function saveNotifications() {
    setSaving(true)
    const { error } = await supabase.from('user_preferences').upsert({
      user_id:           user.id,
      notify_approval:   notifyApproval,
      notify_shared:     notifyShared,
      notify_newsletter: notifyNewsletter,
    })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Notification settings saved')
  }

  // Save password
  async function savePassword() {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setNewPassword(''); setConfirmPassword('') }
  }

  // Toggle category
  function toggleCat(cat) {
    setSelCats(c => c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat])
  }

  // Remove bookmark
  async function removeBookmark(bookmarkId) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) toast.error(error.message)
    else setBookmarks(b => b.filter(x => x.id !== bookmarkId))
  }

  const statusBadge = s => ({
    pending:  <span className="badge-pending">Pending</span>,
    approved: <span className="badge-approved">Approved</span>,
    rejected: <span className="badge-rejected">Rejected</span>,
  }[s])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account, preferences and content.</p>
      </div>

      <div className="grid grid-cols-4 gap-6 items-start">
        {/* Sidebar tabs */}
        <div className="card p-2">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                font-medium transition-all text-left
                ${tab === id
                  ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="col-span-3 card p-6">

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-white">Profile information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt=""
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center
                                    justify-center text-white text-2xl font-bold ring-4
                                    ring-slate-100 dark:ring-slate-800">
                      {(displayName || user?.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-white dark:bg-slate-700
                                    rounded-full border border-slate-200 dark:border-slate-600
                                    flex items-center justify-center cursor-pointer shadow
                                    hover:bg-slate-50 transition-colors">
                    <Camera size={13} className="text-slate-600 dark:text-slate-300" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Profile photo</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, max 2MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Display name
                </label>
                <input className="input" value={displayName}
                  onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input className="input opacity-60" value={user?.email} disabled />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio <span className="text-slate-400">(optional)</span>
                </label>
                <textarea className="input resize-none h-24"
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Tell others a bit about yourself…" />
              </div>

              <button onClick={saveProfile} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {tab === 'preferences' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-white">Content preferences</h2>
              <p className="text-sm text-slate-500">
                Choose which categories appear in your personal feed. If nothing is selected
                or "Show me everything" is on, you'll see a random selection.
              </p>

              {/* Default toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg
                                bg-slate-50 dark:bg-slate-800">
                <div className="relative">
                  <input type="checkbox" className="sr-only"
                    checked={useDefault} onChange={e => setUseDefault(e.target.checked)} />
                  <div className={`w-10 h-5 rounded-full transition-colors
                    ${useDefault ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                      shadow transition-transform ${useDefault ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Show me everything</p>
                  <p className="text-xs text-slate-400">Random selection from all approved documents</p>
                </div>
              </label>

              {/* Category grid */}
              {!useDefault && (
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Select your categories
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border
                          cursor-pointer transition-all text-sm font-medium
                          ${selCats.includes(cat)
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <input type="checkbox" className="sr-only"
                          checked={selCats.includes(cat)}
                          onChange={() => toggleCat(cat)} />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                          transition-colors
                          ${selCats.includes(cat)
                            ? 'bg-brand-600 border-brand-600'
                            : 'border-slate-300 dark:border-slate-600'}`}>
                          {selCats.includes(cat) && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={savePreferences} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save preferences'}
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-white">Notification settings</h2>

              {[
                { label: 'Document approved or rejected',
                  sub: 'Get notified when a moderator reviews your upload',
                  val: notifyApproval, set: setNotifyApproval },
                { label: 'Document shared with me',
                  sub: 'Get notified when someone grants you access to a document',
                  val: notifyShared, set: setNotifyShared },
                { label: 'Newsletter & updates',
                  sub: 'Periodic updates about new content and features',
                  val: notifyNewsletter, set: setNotifyNewsletter },
              ].map(({ label, sub, val, set }) => (
                <label key={label} className="flex items-center justify-between gap-4 p-4
                                              rounded-lg border border-slate-100 dark:border-slate-800
                                              cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50
                                              transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </div>
                  <div className="relative shrink-0">
                    <input type="checkbox" className="sr-only"
                      checked={val} onChange={e => set(e.target.checked)} />
                    <div className={`w-10 h-5 rounded-full transition-colors
                      ${val ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                        shadow transition-transform ${val ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>
                </label>
              ))}

              <button onClick={saveNotifications} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-white">Change password</h2>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New password
                </label>
                <input type="password" className="input" placeholder="Min. 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm new password
                </label>
                <input type="password" className="input" placeholder="Repeat password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button onClick={savePassword} disabled={saving} className="btn-primary">
                <Shield size={14} /> {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          )}

          {/* ── MY DOCUMENTS ── */}
          {tab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">My documents</h2>
                <Link to="/app/my-documents" className="text-xs text-brand-600 hover:underline
                           flex items-center gap-1">
                  Full view <ChevronRight size={12} />
                </Link>
              </div>
              {docsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : myDocs.length === 0 ? (
                <p className="text-sm text-slate-400">No documents uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myDocs.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {doc.category ?? 'Uncategorised'} ·{' '}
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {statusBadge(doc.status)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── BOOKMARKS ── */}
          {tab === 'bookmarks' && (
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Saved documents</h2>
              {bmsLoading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : bookmarks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No bookmarks yet. Use the bookmark icon on any document to save it here.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookmarks.map(bm => (
                    <li key={bm.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0">
                        <Link to={`/doc/${bm.document_id}`}
                          className="text-sm font-medium text-slate-900 dark:text-white
                                     hover:text-brand-600 truncate block">
                          {bm.documents?.title}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {bm.documents?.category ?? 'Uncategorised'} ·{' '}
                          Saved {formatDistanceToNow(new Date(bm.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button onClick={() => removeBookmark(bm.id)}
                        className="text-xs text-red-500 hover:underline shrink-0">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
