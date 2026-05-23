import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Newspaper, FolderOpen,
  Settings, LogOut, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserAvatar({ dark = false }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const initials = (profile?.display_name || user?.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    to: '/app/dashboard' },
    { icon: Newspaper,       label: 'My Feed',       to: '/app/my-feed' },
    { icon: FolderOpen,      label: 'My Documents',  to: '/app/my-documents' },
    { icon: Settings,        label: 'Profile & Settings', to: '/app/profile' },
  ]

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-all
          ${dark
            ? 'hover:bg-white/10 text-white'
            : 'hover:bg-slate-100 text-slate-700'}`}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
                          text-white text-xs font-bold ring-2 ring-white/20">
            {initials}
          </div>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900
                        rounded-xl shadow-xl border border-slate-200 dark:border-slate-700
                        overflow-hidden z-50 animate-in">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt=""
                  className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center
                                justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                           dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800
                           transition-colors"
              >
                <Icon size={15} className="text-slate-400" />
                {label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-100 dark:border-slate-800 py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                         dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                         transition-colors w-full"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
