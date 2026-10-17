import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, back, right, className }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className={cn('mb-5 flex items-start gap-3', className)}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-1 mt-0.5 rounded-full p-2 text-muted hover:bg-ink/5 hover:text-ink focus-ring"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="flex-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
