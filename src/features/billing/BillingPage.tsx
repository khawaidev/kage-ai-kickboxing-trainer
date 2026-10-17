import { Check, Crown } from 'lucide-react'
import { useSettingsStore } from '@/lib/stores/settings'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Seal } from '@/components/ui/Seal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils/cn'
import type { SubscriptionPlan } from '@/lib/types'

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: string
  cadence: string
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    features: ['Limited live coaching', '2 analyses', 'Basic session history'],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '$9.99',
    cadence: 'per month',
    features: [
      'Higher live-session allowance',
      '30 analyses',
      'Detailed reports & progress history',
    ],
    highlight: true,
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    price: '$59.99',
    cadence: 'per year',
    features: ['Everything in Pro', 'Save 50% vs monthly', 'Priority analysis'],
  },
]

export function BillingPage() {
  const { subscription, usage, setPlan } = useSettingsStore()

  const choose = (plan: SubscriptionPlan) => {
    setPlan(plan)
    analytics.track(plan === 'free' ? 'subscription_cancelled' : 'subscription_started', { plan })
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Subscription" subtitle="Manage your plan and usage." back />

      <Card className="flex items-center gap-3">
        <Seal size="md" glyph="拳" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {PLANS.find((p) => p.id === subscription.plan)?.name} plan
          </p>
          <p className="text-xs text-muted">
            {subscription.current_period_end
              ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : 'No renewal — free plan'}
          </p>
        </div>
        <Badge tone={subscription.plan === 'free' ? 'muted' : 'sage'}>
          {subscription.status}
        </Badge>
      </Card>

      <Card className="mt-4 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Analyses</span>
            <span>
              {usage.analyses_used} / {usage.analyses_limit}
            </span>
          </div>
          <Progress value={usage.analyses_used / usage.analyses_limit} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Live sessions</span>
            <span>
              {usage.live_sessions_used} / {usage.live_sessions_limit}
            </span>
          </div>
          <Progress
            value={usage.live_sessions_used / usage.live_sessions_limit}
            tone="sage"
          />
        </div>
      </Card>

      <div className="mt-6 space-y-3">
        {PLANS.map((plan) => {
          const active = subscription.plan === plan.id
          return (
            <Card
              key={plan.id}
              className={cn(
                'space-y-3',
                plan.highlight && 'border-seal/40',
                active && 'border-sage/50',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.highlight && <Crown size={16} className="text-seal-deep" />}
                  <span className="font-display text-lg font-bold">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-xs text-muted">{plan.cadence}</span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/80">
                    <Check size={14} className="text-sage-deep" /> {f}
                  </li>
                ))}
              </ul>
              {active ? (
                <Button variant="secondary" fullWidth disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  variant={plan.highlight ? 'primary' : 'paper'}
                  fullWidth
                  onClick={() => choose(plan.id)}
                >
                  {plan.id === 'free' ? 'Downgrade to Free' : `Choose ${plan.name}`}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Demo billing. Production payments are confirmed through trusted backend events and enforced
        server-side — never from client state alone.
      </p>
    </div>
  )
}
