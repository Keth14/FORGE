import { getApiKey } from './storage'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o'

export async function callJarvis(systemPrompt, userMessage) {
  const key = getApiKey()
  if (!key) throw new Error('NO_KEY')

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'OpenAI API error')
  return data.choices?.[0]?.message?.content || ''
}

export async function callJarvisChat(systemPrompt, messages) {
  const key = getApiKey()
  if (!key) throw new Error('NO_KEY')

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'OpenAI API error')
  return data.choices?.[0]?.message?.content || ''
}

export function formatApiError(err) {
  if (err.message === 'NO_KEY') {
    return 'No API key set. Go to ME → JARVIS KEY and enter your OpenAI key.'
  }
  return `JARVIS offline. ${err.message}`
}
