import { createClient } from '@/lib/supabase/server'

interface ProgressRequest {
  moduleId: number
  sectionId: string
  reflectionText?: string
  aiFeedback?: string
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const moduleId = Number(url.searchParams.get('moduleId') ?? '')

    if (!Number.isInteger(moduleId)) {
      return new Response(JSON.stringify({ error: 'moduleId krävs' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Inte inloggad' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const [{ data: progress, error: progressError }, { data: reflections, error: reflectionError }] = await Promise.all([
      supabase
        .from('module_progress')
        .select('section_id')
        .eq('user_id', user.id)
        .eq('module_id', moduleId),
      supabase
        .from('reflections')
        .select('section_id, reflection_text')
        .eq('user_id', user.id)
        .eq('module_id', moduleId),
    ])

    if (progressError || reflectionError) {
      const errorMessage = progressError?.message ?? reflectionError?.message ?? 'Kunde inte läsa progress'
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        completedSections: progress ?? [],
        reflections: reflections ?? [],
        userName: user.user_metadata?.full_name ?? user.email ?? '',
        track: (user.user_metadata?.track as string) ?? 'utbildningsledare',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Progress API error:', error)
    return new Response(JSON.stringify({ error: 'Internt fel vid läsning av progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: Request) {
  try {
    const body: ProgressRequest = await req.json()
    const moduleId = Number(body?.moduleId)
    const sectionId = typeof body?.sectionId === 'string' ? body.sectionId.trim() : ''

    if (!Number.isInteger(moduleId) || !sectionId) {
      return new Response(JSON.stringify({ error: 'moduleId och sectionId krävs' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Inte inloggad' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error: progressError } = await supabase
      .from('module_progress')
      .upsert(
        [
          {
            user_id: user.id,
            module_id: moduleId,
            section_id: sectionId,
          },
        ],
        { onConflict: 'user_id,module_id,section_id' }
      )

    if (progressError) {
      return new Response(JSON.stringify({ error: progressError.message ?? 'Kunde inte spara progression' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const reflectionText = typeof body.reflectionText === 'string' ? body.reflectionText.trim() : ''
    const aiFeedback = typeof body.aiFeedback === 'string' ? body.aiFeedback : ''

    if (reflectionText.length >= 50) {
      const { error: reflectionError } = await supabase
        .from('reflections')
        .upsert(
          [
            {
              user_id: user.id,
              module_id: moduleId,
              section_id: sectionId,
              reflection_text: reflectionText,
              ai_feedback: aiFeedback,
            },
          ],
          { onConflict: 'user_id,module_id,section_id' }
        )

      if (reflectionError) {
        return new Response(JSON.stringify({ error: reflectionError.message ?? 'Kunde inte spara reflektionen' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Progress API error:', error)
    return new Response(JSON.stringify({ error: 'Internt fel vid sparande' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
