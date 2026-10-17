import { cn } from '@/lib/utils/cn'

interface AppShellProps {
  children: React.ReactNode
  immersive?: boolean
  className?: string
}

export function AppShell({ children, immersive, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-full flex-col bg-paper text-ink',
        'bg-paper-grain bg-repeat',
        className,
      )}
    >
      <div className="pt-safe" />
      <div className={cn('flex flex-1 flex-col', immersive && 'overflow-hidden')}>
        {children}
      </div>
    </div>
  )
}
