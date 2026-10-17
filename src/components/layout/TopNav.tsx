import { Link, NavLink } from 'react-router-dom'
import { Activity, History, Home, Play, Settings } from 'lucide-react'
import { Seal } from '@/components/ui/Seal'
import { cn } from '@/lib/utils/cn'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/history', label: 'Sessions', icon: History },
  { to: '/progress', label: 'Progress', icon: Activity },
  { to: '/settings', label: 'Account', icon: Settings },
]

/** Desktop top navigation. Hidden on small screens (bottom MobileNav is used). */
export function TopNav() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-ink/10 bg-paper/85 backdrop-blur md:block">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <Seal size="sm" glyph="影" label="KAGE" />
          <span className="font-display text-lg font-bold leading-none">KAGE</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring',
                  isActive
                    ? 'bg-ink/5 text-ink'
                    : 'text-muted hover:bg-ink/5 hover:text-ink',
                )
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/configure"
          className="flex items-center gap-2 rounded-xl bg-seal px-4 py-2 text-sm font-semibold text-paper-white shadow-seal transition-colors hover:bg-seal-deep focus-ring"
        >
          <Play size={15} /> Start training
        </Link>
      </div>
    </header>
  )
}
