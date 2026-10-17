import { NavLink } from 'react-router-dom'
import { Activity, History, Home, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/history', label: 'Sessions', icon: History },
  { to: '/progress', label: 'Progress', icon: Activity },
  { to: '/settings', label: 'Account', icon: Settings },
]

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around pb-safe">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-seal' : 'text-muted hover:text-ink',
              )
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
