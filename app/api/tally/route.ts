import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log(
      'FIELDS:',
      JSON.stringify(body.data.fields, null, 2)
    )

    return Response.json({
      success: true,
      received: body
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Webhook failed' },
      { status: 500 }
    )
  }
}
