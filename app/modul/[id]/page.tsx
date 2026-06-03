'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getModulesForTrack } from '@/data/modules'
import { SectionContent } from '@/components/course/SectionContent'
import { QuizCard } from '@/components/course/QuizCard'
import { ProgressBar } from '@/components/course/ProgressBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import type { Track } from '@/types'

interface PageProps {
  params: { id: string }
}

export default function ModulePage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()

  const moduleId = Number(id)

  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [track, setTrack] = useState<Track>('utbildningsledare')
  const [quizPassed, setQuizPassed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [, startLoadTransition] = useTransition()

  const loadProgress = useCallback(async () => {
    const response = await fetch(`/api/progress?moduleId=${moduleId}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401) {
        router.push('/auth/login')
      } else {
        console.error('Failed to load progress:', result.error || response.statusText)
        setErrorMessage(result.error || 'Kunde inte läsa progress. Försök igen.')
      }
      setLoading(false)
      return
    }

    setCompletedSections((result.completedSections ?? []).map((r: { section_id: string }) => r.section_id))
    const reflMap: Record<string, string> = {}
    for (const r of (result.reflections ?? []) as { section_id: string; reflection_text: string }[]) {
      reflMap[r.section_id] = r.reflection_text
    }
    setReflections(reflMap)

    setUserName(result.userName ?? '')
    setTrack((result.track as Track) ?? 'utbildningsledare')

    setLoading(false)
  }, [moduleId, router])

  useEffect(() => {
    startLoadTransition(() => {
      void loadProgress()
    })
  }, [loadProgress, startLoadTransition])

  async function handleComplete(sectionId: string, reflectionText?: string, aiFeedback?: string) {
    setErrorMessage('')

    const response = await fetch('/api/progress', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId,
        sectionId,
        reflectionText,
        aiFeedback,
      }),
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Failed to save module progress:', result.error || response.statusText)
      setErrorMessage(
        result.error
          ? `Kunde inte spara progression: ${result.error}`
          : 'Kunde inte spara progression. Försök igen eller kontakta support om problemet kvarstår.'
      )
      return
    }

    setCompletedSections((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]))
  }

  const modules = getModulesForTrack(track)
  const currentModule = modules.find((m) => m.id === moduleId)

  const reflectionSections = currentModule?.sections.filter((s) => s.type === 'reflection') ?? []
  const reflectionAlreadyCompleted = reflectionSections.some((s) => completedSections.includes(s.id))
  const canShowReflection = !currentModule?.quiz?.length || quizPassed || reflectionAlreadyCompleted

  if (!loading && !currentModule) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-content-muted mb-4">Modulen hittades inte.</p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Tillbaka till översikten
          </Link>
        </div>
      </div>
    )
  }

  const totalSections = currentModule?.sections.length ?? 0
  const completedCount = currentModule?.sections.filter((s) => completedSections.includes(s.id)).length ?? 0
  const isModuleComplete = totalSections > 0 && completedCount === totalSections

  const prevModule = modules.find((m) => m.id === moduleId - 1)
  const nextModule = modules.find((m) => m.id === moduleId + 1)

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header userName={userName} showNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-content-muted mb-6" aria-label="Brödsmula">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Kursöversikt
          </Link>
          <span>/</span>
          <span className="text-content">Modul {moduleId}</span>
        </nav>

        {currentModule && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{currentModule.icon}</span>
                <div>
                  <p className="text-xs font-mono text-content-muted">Modul {currentModule.id}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-content leading-tight">
                    {currentModule.title}
                  </h1>
                  <p className="text-content-muted">{currentModule.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-card border border-border rounded-xl p-4 mb-8">
              <ProgressBar
                completed={completedCount}
                total={totalSections}
                label="Modulens avsnitt"
              />
              {isModuleComplete && (
                <p className="mt-2 text-sm text-secondary font-medium flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" fill="#2D807C" />
                    <path d="M4 7l2.5 2.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Modulen är genomförd!
                </p>
              )}
            </div>
          </>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-surface-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : currentModule ? (
          <>
            {errorMessage && (
              <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                {errorMessage}
              </div>
            )}
            <div className="space-y-4">
              {currentModule.sections
                .filter((s) => s.type !== 'reflection')
              .map((section) => (
                <SectionContent
                  key={section.id}
                  section={section}
                  isCompleted={completedSections.includes(section.id)}
                  onComplete={(reflText, aiFeedback) => handleComplete(section.id, reflText, aiFeedback)}
                  reflectionValue={reflections[section.id] ?? ''}
                  onReflectionChange={(val) =>
                    setReflections((prev) => ({ ...prev, [section.id]: val }))
                  }
                  moduleTitle={currentModule.title}
                />
              ))}

            {currentModule.quiz && currentModule.quiz.length > 0 && (
              <QuizCard
                questions={currentModule.quiz}
                onPassed={() => setQuizPassed(true)}
                alreadyPassed={quizPassed || reflectionAlreadyCompleted}
              />
            )}

            {currentModule.sections
              .filter((s) => s.type === 'reflection')
              .map((section) =>
                canShowReflection ? (
                  <SectionContent
                    key={section.id}
                    section={section}
                    isCompleted={completedSections.includes(section.id)}
                    onComplete={(reflText, aiFeedback) => handleComplete(section.id, reflText, aiFeedback)}
                    reflectionValue={reflections[section.id] ?? ''}
                    onReflectionChange={(val) =>
                      setReflections((prev) => ({ ...prev, [section.id]: val }))
                    }
                    moduleTitle={currentModule.title}
                  />
                ) : (
                  <div
                    key={section.id}
                    className="bg-surface-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🔒</span>
                      <span className="text-xs font-mono text-content-muted uppercase tracking-wider">
                        Reflektion
                      </span>
                    </div>
                    <p className="font-semibold text-content mb-1">{section.title}</p>
                    <p className="text-sm text-content-muted">
                      Svara rätt på alla quizfrågor för att låsa upp reflektionen.
                    </p>
                  </div>
                )
              )}
            </div>
          </> ) : null}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          {prevModule ? (
            <Link
              href={`/modul/${prevModule.id}`}
              className="flex items-center gap-2 text-sm text-content-muted hover:text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Modul {prevModule.id}: {prevModule.title}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-content-muted hover:text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tillbaka till översikten
            </Link>
          )}

          {nextModule ? (
            <Link
              href={`/modul/${nextModule.id}`}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Modul {nextModule.id}: {nextModule.title}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : isModuleComplete ? (
            <Link
              href="/examination"
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Gå till examinationen
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}
