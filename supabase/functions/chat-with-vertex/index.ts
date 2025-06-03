
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    // Get Vertex AI credentials from environment
    const credentialsJson = Deno.env.get('VERTEX_AI_CREDENTIALS')
    if (!credentialsJson) {
      throw new Error('VERTEX_AI_CREDENTIALS not found')
    }

    const credentials = JSON.parse(credentialsJson)
    const projectId = credentials.project_id

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(credentials)
      })
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Call Vertex AI API with Gemini Flash 2.0
    const vertexResponse = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: message
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          },
        })
      }
    )

    const vertexData = await vertexResponse.json()
    console.log('Vertex AI Response:', vertexData)

    if (!vertexResponse.ok) {
      throw new Error(`Vertex AI API error: ${vertexData.error?.message || 'Unknown error'}`)
    }

    const aiResponse = vertexData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in chat-with-vertex function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function createJWT(credentials: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, (c) => c === '+' ? '-' : '_').replace(/=/g, '')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, (c) => c === '+' ? '-' : '_').replace(/=/g, '')
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  // Import the private key
  const privateKeyPem = credentials.private_key
  const privateKeyFormatted = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const privateKeyBytes = Uint8Array.from(atob(privateKeyFormatted), c => c.charCodeAt(0))
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, (c) => c === '+' ? '-' : '_')
    .replace(/=/g, '')

  return `${signatureInput}.${encodedSignature}`
}
