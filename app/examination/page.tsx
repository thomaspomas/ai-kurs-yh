'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getModulesForTrack } from '@/data/modules'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import type { Track } from '@/types'

const PARTS = [
  {
    id: 'part1',
    number: 1,
    title: 'Verksamhetsanalys',
    description:
      'Beskriv ett konkret arbetsmoment i din yrkesroll som du antingen hanterar med AI-stöd eller bedömer skulle kunna dra nytta av det. Beskriv vad arbetsuppgiften innebär, vilka krav på korrekthet som gäller och hur den hanteras i dag.',
    minLength: 200,
    placeholder: 'Beskriv arbetsuppgiften, dess kontext och nuvarande hantering...',
  },
  {
    id: 'part2',
    number: 2,
    title: 'AI-stött arbetssätt',
    description:
      'Designa ett konkret AI-stött tillvägagångssätt. Inkludera minst en välstrukturerad instruktion (med roll, kontext, uppgift och begränsning), hur du hanterar kontextbegränsningar och hur du kvalitetssäkrar AI:ns output. Om automatiserade flöden är relevanta, beskriv kontrollpunkterna.',
    minLength: 300,
    placeholder: 'Inkludera din formulerade instruktion och beskriv hela arbetssättet...',
  },
  {
    id: 'part3',
    number: 3,
    title: 'Motivering av val och begränsningar',
    description:
      'Argumentera för varför ditt föreslagna tillvägagångssätt är lämpligt och beskriv tydligt dess begränsningar. Vad kan AI inte göra i detta arbetsmoment? Vilka risker finns? Finns det aspekter där du aktivt väljer att INTE använda AI, och varför?',
    minLength: 200,
    placeholder: 'Motivera dina val och identifiera begränsningar...',
  },
  {
    id: 'part4',
    number: 4,
    title: 'Reflektion över ansvar och kvalitet',
    description:
      'Hur förändrar ditt föreslagna arbetssätt ditt eget ansvar i din yrkesroll? Vad behöver du kunna – i termer av kompetens och omdöme – för att använda AI ansvarsfullt? Vad skulle du rekommendera din organisation som riktlinje?',
    minLength: 200,
    placeholder: 'Reflektera över ansvar, kompetens och organisatoriska riktlinjer...',
  },
]

export default function ExaminationPage() {
  const router = useRouter()

  const [userName, setUserName] = useState('')
  const [track, setTrack] = useState<Track>('utbildningsledare')
  const [answers, setAnswers] = useState<Record<string, string>>({
    part1: '',
    part2: '',
    part3: '',
    part4: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [allModulesDone, setAllModulesDone] = useState(false)
  const [activePart, setActivePart] = useState(0)
  const [, startLoadTransition] = useTransition()

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    setUserName(user.user_metadata?.full_name ?? user.email ?? '')

    const track: Track = (user.user_metadata?.track as Track) ?? 'utbildningsledare'
    setTrack(track)
    const modules = getModulesForTrack(track)

    const { data: progress } = await supabase
      .from('module_progress')
      .select('section_id')
      .eq('user_id', user.id)

    const completedSections = (progress ?? []).map((r: { section_id: string }) => r.section_id)
    const done = modules.every((m) => m.sections.every((s) => completedSections.includes(s.id)))
    setAllModulesDone(done)

    const { data: exam } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (exam) {
      setAnswers({ part1: exam.part1, part2: exam.part2, part3: exam.part3, part4: exam.part4 })
      setSubmitted(true)
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    startLoadTransition(() => {
      void loadData()
    })
  }, [loadData, startLoadTransition])

  async function handleSubmit() {
    setError('')
    for (const part of PARTS) {
      if (answers[part.id].trim().length < part.minLength) {
        setError(`Del ${part.number} behöver minst ${part.minLength} tecken.`)
        setActivePart(part.number - 1)
        return
      }
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data, error: dbError } = await supabase.rpc('submit_exam', {
      p_part1: answers.part1,
      p_part2: answers.part2,
      p_part3: answers.part3,
      p_part4: answers.part4,
      p_user_name: userName,
      p_track: track,
    })

    if (dbError || data !== true) {
      setError('Något gick fel. Kontrollera att alla moduler är genomförda och försök igen.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-content-muted">Laddar...</div>
      </div>
    )
  }

  if (!allModulesDone) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header userName={userName} showNav />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <span className="text-4xl mb-4 block">🔒</span>
            <h1 className="text-xl font-bold text-content mb-2">Examinationen är låst</h1>
            <p className="text-content-muted mb-4">
              Genomför alla 8 moduler innan du kan göra examinationen.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#C75000' }}
            >
              Tillbaka till kursöversikten
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header userName={userName} showNav />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <span className="text-5xl mb-6 block">🎓</span>
            <h1 className="text-2xl font-bold text-content mb-3">Examinationen är godkänd!</h1>
            <p className="text-content-muted mb-6">
              Grattis! Du har genomfört alla moduler och examinationen. Ditt diplom är nu tillgängligt.
            </p>
            <Link
              href="/diplom"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#2D807C' }}
            >
              Hämta ditt diplom
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentPart = PARTS[activePart]
  const currentAnswer = answers[currentPart.id]
  const isCurrentValid = currentAnswer.trim().length >= currentPart.minLength
  const allAnswered = PARTS.every((p) => answers[p.id].trim().length >= p.minLength)

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header userName={userName} showNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-content-muted mb-4" aria-label="Brödsmula">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Kursöversikt
            </Link>
            <span>/</span>
            <span className="text-content">Examination</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-content mb-1">Examination</h1>
          <p className="text-content-muted">
            Analysera ett verkligt arbetsmoment och designa ett AI-stött arbetssätt
          </p>
        </div>

        {/* Part navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {PARTS.map((part, i) => {
            const isDone = answers[part.id].trim().length >= part.minLength
            return (
              <button
                key={part.id}
                onClick={() => setActivePart(i)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activePart === i
                    ? 'text-white'
                    : 'bg-surface-card border border-border text-content-muted hover:text-content'
                }`}
                style={activePart === i ? { backgroundColor: '#C75000' } : {}}
              >
                {isDone && <span className="text-xs">✓</span>}
                Del {part.number}
              </button>
            )
          })}
        </div>

        {/* Current part */}
        <div className="bg-surface-card border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary uppercase tracking-wider">
              Del {currentPart.number} av {PARTS.length}
            </span>
          </div>
          <h2 className="text-lg font-bold text-content mb-3">{currentPart.title}</h2>
          <p className="text-sm text-content-muted leading-relaxed mb-4">
            {currentPart.description}
          </p>

          <textarea
            value={currentAnswer}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [currentPart.id]: e.target.value }))
            }
            placeholder={currentPart.placeholder}
            rows={10}
            className="w-full rounded-lg border border-border bg-surface text-content p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-content-muted"
          />

          <div className="flex items-center justify-between mt-2 text-xs text-content-muted">
            <span>
              {currentAnswer.trim().length} / {currentPart.minLength} tecken (minimum)
            </span>
            {isCurrentValid && (
              <span className="text-secondary font-medium">✓ Tillräckligt</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setActivePart((p) => Math.max(0, p - 1))}
            disabled={activePart === 0}
            className="px-4 py-2 rounded-lg text-sm border border-border text-content-muted hover:text-content transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Föregående
          </button>

          {activePart < PARTS.length - 1 ? (
            <button
              onClick={() => setActivePart((p) => Math.min(PARTS.length - 1, p + 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
              style={{ backgroundColor: '#C75000' }}
            >
              Nästa →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: allAnswered ? '#2D807C' : '#9ca3af' }}
            >
              {submitting ? 'Lämnar in...' : 'Lämna in examination'}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {!allAnswered && activePart === PARTS.length - 1 && (
          <p className="mt-3 text-sm text-content-muted">
            Alla fyra delar måste fyllas i (se minimikraven ovan) för att lämna in.
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
