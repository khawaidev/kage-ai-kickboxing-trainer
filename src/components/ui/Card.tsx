import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'ink' | 'paper'
  as?: 'div' | 'section' | 'article'
}

export function Card({ className, tone = 'paper', as = 'div', ...props }: CardProps) {
  const Comp = as
  return (
    <Comp
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        tone === 'ink' ? 'surface-ink' : 'paper-panel',
        className,
      )}
      {...props}
    />
  )
}
