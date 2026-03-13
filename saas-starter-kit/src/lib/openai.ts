import OpenAI from 'openai'
import { prisma } from './prisma'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Track AI usage per user — critical for rate limiting and billing
export async function trackUsage({
  userId,
  model,
  promptTokens,
  completionTokens,
  endpoint,
}: {
  userId: string
  model: string
  promptTokens: number
  completionTokens: number
  endpoint: string
}) {
  const totalTokens = promptTokens + completionTokens
  // Approximate cost (GPT-4o pricing)
  const cost = (promptTokens / 1000) * 0.005 + (completionTokens / 1000) * 0.015

  await prisma.aIUsage.create({
    data: {
      userId,
      model,
      tokens: totalTokens,
      cost,
      endpoint,
    },
  })
  return { totalTokens, cost }
}

// Check if user has exceeded daily free tier limit
export async function checkRateLimit(userId: string, plan: string) {
  if (plan === 'PRO' || plan === 'ENTERPRISE') return { allowed: true }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const usage = await prisma.aIUsage.findMany({
    where: { userId, createdAt: { gte: today } },
  })

  const totalRequests = usage.length
  return { allowed: totalRequests < 5, remaining: Math.max(0, 5 - totalRequests) }
}

// Streaming AI response helper
export async function streamCompletion({
  messages,
  model = 'gpt-4o-mini',
  systemPrompt,
}: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  model?: string
  systemPrompt?: string
}) {
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  msgs.push(...messages)

  const stream = await openai.chat.completions.create({
    model,
    messages: msgs,
    stream: true,
  })

  return stream
}
