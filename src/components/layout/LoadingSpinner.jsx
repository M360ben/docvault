export default function LoadingSpinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className={`${sz} border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin`} />
    </div>
  )
}
