import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Upload, FolderOpen, BookOpen,
  ShieldCheck, Settings, LogOut, FileText, Moon, Sun
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const navItem = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ' +
  'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ' +
  'hover:text-slate-900 dark:hover:text-white transition-all'
const navActive = 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 ' +
  'hover:bg-brand-50 dark:hover:bg-brand-600/20'

export default function Layout() {
  const { user, profile, isModerator, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d0f14]">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800
                        bg-white dark:bg-slate-900">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">DocVault</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/dashboard" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <Upload size={16} /> Upload Document
          </NavLink>
          <NavLink to="/my-documents" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <FolderOpen size={16} /> My Documents
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
            <BookOpen size={16} /> Public Library
          </NavLink>

          {isModerator && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                Moderation
              </div>
              <NavLink to="/moderation" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
                <ShieldCheck size={16} /> Review Queue
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                Admin
              </div>
              <NavLink to="/admin" className={({ isActive }) => `${navItem} ${isActive ? navActive : ''}`}>
                <Settings size={16} /> Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 space-y-1">
          <button onClick={toggleDark} className={navItem + ' w-full'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleSignOut} className={navItem + ' w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}>
            <LogOut size={16} /> Sign out
          </button>
          <div className="px-3 py-2 mt-1">
            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
              {profile?.display_name || user?.email}
            </p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role ?? 'user'}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
