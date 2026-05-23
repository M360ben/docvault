import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { UploadCloud, FileText, X, Globe, Lock } from 'lucide-react'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png', 'image/jpeg', 'image/webp'
]
const MAX_MB = 20

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file,        setFile]        = useState(null)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [isPublic,    setIsPublic]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [progress,    setProgress]    = useState(0)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) { toast.error('File type not allowed'); return }
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`Max file size is ${MAX_MB}MB`); return }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 1, accept: { 'application/pdf': [], 'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'text/plain': [], 'image/*': [] }
  })

  async function handleUpload() {
    if (!file || !title.trim()) { toast.error('Title and file are required'); return }
    setUploading(true)
    setProgress(10)

    try {
      // 1. Upload file to storage
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })
      if (storageErr) throw storageErr
      setProgress(60)

      // 2. Insert document record
      const { error: dbErr } = await supabase.from('documents').insert({
        title:       title.trim(),
        description: description.trim() || null,
        file_path:   path,
        file_size:   file.size,
        mime_type:   file.type,
        uploaded_by: user.id,
        is_public:   isPublic,
        status:      'pending'
      })
      if (dbErr) throw dbErr
      setProgress(100)

      toast.success('Document uploaded! A moderator will review it shortly.')
      navigate('/app/my-documents')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function fmt(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1048576).toFixed(1)} MB`
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload document</h1>
        <p className="text-slate-500 mt-1">Supported: PDF, Word, TXT, images · Max {MAX_MB}MB</p>
      </div>

      <div className="space-y-5">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-600/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-brand-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{fmt(file.size)}</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <UploadCloud size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isDragActive ? 'Drop it here!' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input type="text" className="input" placeholder="Document title"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea className="input resize-none h-24" placeholder="Briefly describe this document…"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Visibility */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Visibility after approval</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => setIsPublic(false)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                ${!isPublic
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Lock size={15} /> Private
            </button>
            <button type="button"
              onClick={() => setIsPublic(true)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                ${isPublic
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Globe size={15} /> Public
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isPublic
              ? 'Anyone can find this in the public library once approved.'
              : 'Only users you explicitly share with can view this document.'}
          </p>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 text-right">{progress}%</p>
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading || !file || !title.trim()}
          className="btn-primary w-full justify-center">
          {uploading ? 'Uploading…' : 'Upload document'}
        </button>
      </div>
    </div>
  )
}
