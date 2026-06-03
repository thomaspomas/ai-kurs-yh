import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Track } from '@/types'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string) {
  const now = Date.now()
  const current = rateLimit.get(key)
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  current.count += 1
  return current.count > RATE_LIMIT_MAX_REQUESTS
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Inte inloggad', { status: 401 })
    }

    if (isRateLimited(user.id)) {
      return new Response('För många förfrågningar. Försök igen strax.', { status: 429 })
    }

    const { reflection, questionTitle, moduleTitle } = await req.json()

    if (typeof reflection !== 'string' || reflection.trim().length < 10) {
      return new Response('För kort reflektion', { status: 400 })
    }

    if (reflection.length > 4000) {
      return new Response('Reflektionen är för lång', { status: 400 })
    }

    const safeQuestionTitle = typeof questionTitle === 'string' ? questionTitle.slice(0, 200) : ''
    const safeModuleTitle = typeof moduleTitle === 'string' ? moduleTitle.slice(0, 200) : ''

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response('API-nyckel saknas', { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const trackSettings: Record<Track, { courseTitle: string; audience: string }> = {
      utbildningsledare: {
        courseTitle: 'AI för utbildningsledare – mellannivå',
        audience: 'utbildningsledare inom yrkeshögskola och vuxenutbildning',
      },
      'yh-ledning': {
        courseTitle: 'AI för YH-ledning – mellannivå',
        audience: 'ledning, styrelse och beslutsfattare inom YH',
      },
      'yh-larare': {
        courseTitle: 'AI för YH-lärare – mellannivå',
        audience: 'lärare och handledare på yrkeshögskola',
      },
      'yh-studerande': {
        courseTitle: 'AI för YH-studerande – mellannivå',
        audience: 'studenter på yrkeshögskola och vuxenutbildning',
      },
      'yh-affarsutvecklare': {
        courseTitle: 'AI för affärsutvecklare inom YH – mellannivå',
        audience: 'affärs- och verksamhetsutvecklare inom YH',
      },
      'ai-grundkurs': {
        courseTitle: 'AI-grundkurs – kom igång från grunden',
        audience: 'alla som vill förstå AI från början',
      },
    }

    const safeTrack = (user.user_metadata?.track as Track) ?? 'utbildningsledare'
    const settings = trackSettings[safeTrack]

    const systemPrompt = [
      `Du är en kursassistent för kursen "${settings.courseTitle}", riktad till ${settings.audience}. Din uppgift är att ge kort, konstruktiv återkoppling på deltagarens reflektion.`,
      '',
      'Ge återkoppling som:',
      '- Bekräftar det som är genomtänkt i reflektionen',
      '- Lyfter fram ett perspektiv eller en aspekt som deltagaren kan fördjupa',
      '- Avslutar med en kort följdfråga som för tanken vidare',
      '',
      'Håll svaret kort (3–5 meningar). Skriv på svenska. Var konkret och professionell, inte översvallande.',
    ].join('\n')

    const userContent = [
      `Modul: ${safeModuleTitle}`,
      `Reflektionsfråga: ${safeQuestionTitle}`,
      '',
      'Min reflektion:',
      reflection,
    ].join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    console.error('Feedback API error:', err)
    return new Response('Internt fel', { status: 500 })
  }
}
