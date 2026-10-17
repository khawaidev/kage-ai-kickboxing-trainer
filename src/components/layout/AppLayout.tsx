import { AppShell } from './AppShell'
import { MobileNav } from './MobileNav'
import { TopNav } from './TopNav'
import { PwaPrompts } from '@/components/pwa/PwaPrompts'

interface AppLayoutProps {
  children: React.ReactNode
  /** Hide navigation and page padding for immersive screens (workout, camera). */
  immersive?: boolean
  noPadding?: boolean
  /** Hide all navigation (used by public marketing/auth pages). */
  bare?: boolean
}

export function AppLayout({ children, immersive, noPadding, bare }: AppLayoutProps) {
  const showNav = !immersive && !bare
  return (
    <AppShell immersive={immersive}>
      {showNav && <TopNav />}
      <main className={immersive || bare ? '' : 'pb-28 md:pb-10'}>
        <div
          className={
            noPadding || bare
              ? ''
              : 'mx-auto w-full max-w-lg px-4 pt-4 md:max-w-3xl md:px-6 md:pt-8'
          }
        >
          {children}
        </div>
      </main>
      {showNav && <MobileNav />}
      {!bare && <PwaPrompts />}
    </AppShell>
  )
}
