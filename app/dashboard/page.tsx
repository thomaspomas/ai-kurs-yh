import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getModulesForTrack } from '@/data/modules'
import { ModuleCard } from '@/components/course/ModuleCard'
import { ProgressBar } from '@/components/course/ProgressBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { DownloadReflections } from '@/components/course/DownloadReflections'
import { AudioIntro } from '@/components/course/AudioIntro'
import type { Track } from '@/types'

const trackLabels: Record<Track, string> = {
  utbildningsledare: 'AI för utbildningsledare – mellannivå',
  'yh-ledning': 'AI för YH-ledning – mellannivå',
  'yh-larare': 'AI för YH-lärare – mellannivå',
  'yh-studerande': 'AI för YH-studerande – mellannivå',
  'yh-affarsutvecklare': 'AI för affärsutvecklare inom YH – mellannivå',
  'ai-grundkurs': 'AI-grundkurs – kom igång från grunden',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const userName: string = user.user_metadata?.full_name ?? user.email ?? 'Deltagare'
  const track: Track = (user.user_metadata?.track as Track) ?? 'utbildningsledare'
  const modules = getModulesForTrack(track)

  const { data: progressRows } = await supabase
    .from('module_progress')
    .select('section_id')
    .eq('user_id', user.id)

  const completedSections = (progressRows ?? []).map((r: { section_id: string }) => r.section_id)

  const totalSections = modules.reduce((acc, m) => acc + m.sections.length, 0)
  const completedCount = completedSections.length

  const { data: exam } = await supabase
    .from('exam_submissions')
    .select('approved')
    .eq('user_id', user.id)
    .maybeSingle()

  const allModulesDone = modules.every((m) =>
    m.sections.every((s) => completedSections.includes(s.id))
  )
  const examApproved = exam?.approved === true
  const canGenerateDiploma = allModulesDone && examApproved

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header userName={userName} showNav />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-content mb-1">
            Hej, {userName.split(' ')[0]}
          </h1>
          <p className="text-content-muted">
            {trackLabels[track]}
          </p>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-5 mb-8">
          <h2 className="text-sm font-mono text-content-muted uppercase tracking-wider mb-4">
            Din sammanlagda progress
          </h2>
          <ProgressBar
            completed={completedCount}
            total={totalSections}
            label="Avsnitt genomförda"
          />

          {canGenerateDiploma && (
            <div className="mt-4 flex items-center gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/30">
              <span className="text-2xl">🎓</span>
              <div className="flex-1">
                <p className="font-bold text-content">Grattis – du är klar!</p>
                <p className="text-sm text-content-muted">
                  Alla moduler och examinationen är genomförda.
                </p>
              </div>
              <Link
                href="/diplom"
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#2D807C' }}
              >
                Hämta diplom
              </Link>
            </div>
          )}

          {allModulesDone && !examApproved && (
            <div className="mt-4 flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-2xl">📝</span>
              <div className="flex-1">
                <p className="font-bold text-content">Alla moduler klara!</p>
                <p className="text-sm text-content-muted">
                  Nu återstår examinationen för att erhålla ditt diplom.
                </p>
              </div>
              <Link
                href="/examination"
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#C75000' }}
              >
                Gå till examinationen
              </Link>
            </div>
          )}
        </div>

        {track === 'ai-grundkurs' && <AudioIntro />}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-content-muted uppercase tracking-wider">
            Moduler
          </h2>
          <DownloadReflections userName={userName} track={track} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              completedSections={completedSections}
            />
          ))}
        </div>

        <div className="mt-6">
          <div
            className={`border-2 rounded-xl p-5 flex items-center gap-4 transition-colors ${
              examApproved
                ? 'border-secondary/40 bg-secondary/5'
                : 'border-border bg-surface-card'
            }`}
          >
            <span className="text-3xl">{examApproved ? '✅' : '📋'}</span>
            <div className="flex-1">
              <p className="text-xs font-mono text-content-muted mb-0.5">Obligatorisk</p>
              <h3 className="font-bold text-content">Examination</h3>
              <p className="text-sm text-content-muted">
                Analysera ett arbetsmoment och designa ett AI-stött arbetssätt
              </p>
            </div>
            {!examApproved && (
              <Link
                href="/examination"
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium border border-border text-content hover:border-primary/60 transition-colors"
              >
                {allModulesDone ? 'Starta' : 'Låst'}
              </Link>
            )}
            {examApproved && (
              <span className="text-sm font-medium text-secondary">Godkänd</span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
