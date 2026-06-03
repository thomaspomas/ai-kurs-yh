'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { Track } from '@/types'

const trackOptions: { id: Track; label: string; desc: string; icon: string }[] = [
  {
    id: 'utbildningsledare',
    label: 'Utbildningsledare',
    desc: 'Du som leder eller ansvarar för en YH- eller KY-verksamhet och vill använda AI för att förbättra utbildningsstrategi, kvalitetssäkring och styrning.',
    icon: '📋',
  },
  {
    id: 'yh-ledning',
    label: 'YH-ledning',
    desc: 'Du i rektor-, vd- eller styrelseroll som behöver förstå AI:s strategiska möjligheter, risker och styrning i en YH-organisation.',
    icon: '🏛️',
  },
  {
    id: 'yh-larare',
    label: 'YH-lärare',
    desc: 'Du som undervisar eller handleder YH-studenter och vill använda AI för att skapa bättre undervisning, bedömningar och studiehandledning.',
    icon: '🎓',
  },
  {
    id: 'yh-studerande',
    label: 'YH-studerande',
    desc: 'Du som studerar på en YH-utbildning och vill använda AI för att lära snabbare, strukturera dina studier och skriva reflektioner och uppgifter med trygghet.',
    icon: '📚',
  },
  {
    id: 'yh-affarsutvecklare',
    label: 'Affärsutvecklare inom YH',
    desc: 'Du som arbetar med affärs- eller verksamhetsutveckling inom YH och vill använda AI för idéutveckling, analys och strategiskt beslutsstöd.',
    icon: '🚀',
  },
  {
    id: 'ai-grundkurs',
    label: 'AI-grundkurs',
    desc: 'Du som vill förstå AI från grunden – vad det kan och inte kan göra, med fokus på användbara arbetsmetoder snarare än teknisk teori.',
    icon: '🌱',
  },
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get('track') as Track | null

  const [step, setStep] = useState<'track' | 'form'>(preselected ? 'form' : 'track')
  const [track, setTrack] = useState<Track>(preselected ?? 'utbildningsledare')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, track } },
    })

    if (signUpError) {
      setError(
        signUpError.message === 'User already registered'
          ? 'Det finns redan ett konto med den e-postadressen.'
          : 'Något gick fel. Försök igen.'
      )
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
        <div className="bg-surface-card border border-border rounded-2xl p-8 shadow-sm max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-xl font-bold text-content mb-2">Bekräfta din e-post</h1>
          <p className="text-content-muted text-sm mb-4">
            Vi har skickat ett bekräftelsemejl till <strong>{email}</strong>. Klicka på länken i
            mejlet för att aktivera ditt konto.
          </p>
          <Link href="/auth/login" className="text-sm text-primary font-medium hover:underline">
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex justify-between items-center p-4 sm:p-6">
        <div />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-content-muted select-none">Darkmode On/Off</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {step === 'track' ? (
            <div className="bg-surface-card border border-border rounded-2xl p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-content mb-1">Välj din ingång</h1>
              <p className="text-content-muted text-sm mb-6">
                Kursen är anpassad efter din roll
              </p>
              <div className="space-y-3">
                {trackOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTrack(t.id); setStep('form') }}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      track === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{t.icon}</span>
                    <div>
                      <p className="font-semibold text-content text-sm">{t.label}</p>
                      <p className="text-xs text-content-muted mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm text-center text-content-muted">
                Har du redan ett konto?{' '}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                  Logga in
                </Link>
              </p>
            </div>
          ) : (
            <div className="bg-surface-card border border-border rounded-2xl p-8 shadow-sm">
              <button
                onClick={() => setStep('track')}
                className="flex items-center gap-1.5 text-xs text-content-muted hover:text-primary mb-4 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Byt ingång
              </button>

              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-lg">{trackOptions.find(t => t.id === track)?.icon}</span>
                <div>
                  <p className="text-xs text-primary font-medium">{trackOptions.find(t => t.id === track)?.label}</p>
                  <p className="text-xs text-content-muted">{trackOptions.find(t => t.id === track)?.desc}</p>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-content mb-1">Skapa konto</h1>
              <p className="text-content-muted text-sm mb-6">
                Starta kursen AI för {trackOptions.find(t => t.id === track)?.label.toLowerCase()}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5" htmlFor="name">
                    Ditt namn
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-content-muted"
                    placeholder="Förnamn Efternamn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-content mb-1.5" htmlFor="email">
                    E-postadress
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-content-muted"
                    placeholder="din@epost.se"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-content mb-1.5" htmlFor="password">
                    Lösenord
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-content-muted"
                    placeholder="Minst 8 tecken"
                  />
                </div>

                {error && (
                  <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: '#C75000' }}
                >
                  {loading ? 'Skapar konto...' : 'Skapa konto och starta'}
                </button>

                <p className="text-xs text-content-muted text-center leading-relaxed">
                  Du kommer få ett mail med avsändare &quot;Supabase Auth&quot;. Klicka på länken i detta för att skapa ditt konto.
                </p>
              </form>

              <p className="mt-6 text-sm text-center text-content-muted">
                Har du redan ett konto?{' '}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                  Logga in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
