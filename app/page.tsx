import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Footer } from '@/components/layout/Footer'

const tracks = [
  {
    id: 'utbildningsledare',
    icon: '📋',
    title: 'Utbildningsledare',
    desc: 'Du som leder eller ansvarar för en YH- eller KY-verksamhet och vill använda AI för att förbättra utbildningsstrategi, kvalitetssäkring och styrning.',
  },
  {
    id: 'yh-ledning',
    icon: '🏛️',
    title: 'YH-ledning',
    desc: 'Du i rektor-, vd- eller styrelseroll som behöver förstå AI:s strategiska möjligheter, risker och styrning i en YH-organisation.',
  },
  {
    id: 'yh-larare',
    icon: '🎓',
    title: 'YH-lärare',
    desc: 'Du som undervisar eller handleder YH-studenter och vill använda AI för bättre undervisning, bedömningar och studiehandledning.',
  },
  {
    id: 'yh-studerande',
    icon: '📚',
    title: 'YH-studerande',
    desc: 'Du som studerar på en YH-utbildning och vill använda AI för att lära snabbare, strukturera dina studier och skriva reflektioner och uppgifter med trygghet.',
  },
  {
    id: 'yh-affarsutvecklare',
    icon: '🚀',
    title: 'Affärsutvecklare inom YH',
    desc: 'Du som arbetar med affärs- eller verksamhetsutveckling inom YH och vill använda AI för idéutveckling, analys och strategiskt beslutsfattande.',
  },
  {
    id: 'ai-grundkurs',
    icon: '🌱',
    title: 'AI-grundkurs',
    desc: 'Du som vill förstå AI från grunden – vad det kan och inte kan göra, med fokus på användbara arbetsmetoder snarare än teknisk teori.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="bg-surface-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/thomas.png" alt="Thomas Carlberg" width={128} height={128} className="h-32 w-auto logo-adaptive" priority />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-content-muted select-none">Darkmode On/Off</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row items-center gap-10">
          <Image
            src="/hero_pic.png"
            alt=""
            aria-hidden="true"
            width={384}
            height={384}
            className="w-full sm:w-80 md:w-96 h-auto shrink-0 object-contain rounded dark:hidden"
            style={{ border: '2px solid rgb(192, 70, 0)' }}
            priority
          />
          <Image
            src="/hero_pic_dm.png"
            alt=""
            aria-hidden="true"
            width={384}
            height={384}
            className="w-full sm:w-80 md:w-96 h-auto shrink-0 object-contain rounded hidden dark:block"
            style={{ border: '2px solid rgb(192, 70, 0)' }}
            priority
          />
          <div className="max-w-2xl">
            <p className="text-sm font-mono text-primary mb-4 uppercase tracking-wider">
              Mellannivå · Självstudier
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-content mb-6 leading-tight">
              AI för
              <br />
              <span style={{ color: '#C75000' }}>yrkeshögskolan</span>
            </h1>
            <p className="text-lg text-content-muted mb-8 leading-relaxed">
              Detta är en tillämpad kurs, anpassad efter ditt spår – ledning, lärare, studerande eller
              affärsutveckling på en yrkeshögskola. Kursen tar dig bortom grundläggande "vad är AI?" och
              enkelt chattande, vidare mot strategisk förståelse, ansvarsfull användning och ett mer
              informerat beslutsfattande i praktiken. Om du känner att AI är helt nytt, så finns en modul
              för dig med (AI-grundkurs). Välkommen och hoppas du har nytta av sidan!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#C75000' }}
              >
                Välj din ingång och starta
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium border border-border text-content hover:border-primary/60 transition-colors"
              >
                Logga in
              </Link>
            </div>
          </div>
          </div>
        </section>

        {/* Track selector */}
        <section className="bg-surface-card border-y border-border py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-sm font-mono text-content-muted uppercase tracking-wider mb-6">
              Välj din ingång
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/auth/register?track=${t.id}`}
                  className="flex items-start gap-4 p-5 rounded-xl bg-surface border-2 border-border hover:border-primary/50 transition-colors group"
                >
                  <span className="text-3xl shrink-0">{t.icon}</span>
                  <div>
                    <p className="font-bold text-content group-hover:text-primary transition-colors mb-1">
                      {t.title}
                    </p>
                    <p className="text-sm text-content-muted leading-relaxed">{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Modules overview */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-sm font-mono text-content-muted uppercase tracking-wider mb-6">
            8 moduler per ingång
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: 1, icon: '🧠', title: 'AI ur rätt perspektiv' },
              { n: 2, icon: '💾', title: 'Tokens, kontext och minne' },
              { n: 3, icon: '✏️', title: 'Att beställa rätt resultat' },
              { n: 4, icon: '🎭', title: 'Perspektivanalys' },
              { n: 5, icon: '🤖', title: 'Automatiserade processer' },
              { n: 6, icon: '⚡', title: 'AI i realtid' },
              { n: 7, icon: '⚖️', title: 'Risker och ansvar' },
              { n: 8, icon: '🎯', title: 'Strategisk styrning' },
            ].map((m) => (
              <div
                key={m.n}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-card border border-border"
              >
                <span className="text-xl shrink-0">{m.icon}</span>
                <div>
                  <p className="text-xs text-content-muted font-mono">Modul {m.n}</p>
                  <p className="text-sm font-medium text-content leading-tight">{m.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-surface-card border-t border-border py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-sm font-mono text-content-muted uppercase tracking-wider mb-6">
              Om denna kurs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: '🎓',
                  title: 'Diplom vid godkänd examination',
                  desc: 'Erhåll ett nedladdningsbart diplom när du genomfört alla moduler och slutexaminationen.',
                },
                {
                  icon: '📍',
                  title: 'Återuppta där du slutade',
                  desc: 'Dina framsteg sparas automatiskt. Fortsätt kursen när det passar dig.',
                },
                {
                  icon: '🔒',
                  title: 'Baserat på YH-praxis',
                  desc: 'Alla exempel och övningar är hämtade från yrkeshögskolans faktiska kontext.',
                },
                {
                  icon: '💬',
                  title: 'Reflektion med återkoppling',
                  desc: 'Du kommer i varje uppgift behöva reflektera på det du just lärt dig. Om du vill kommer du direkt få återkoppling på din reflektion från en inbyggd AI.',
                },
              ].map((f) => (
                <div key={f.title} className="bg-surface border border-border rounded-xl p-5">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h3 className="font-bold text-content mb-2">{f.title}</h3>
                  <p className="text-sm text-content-muted leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
