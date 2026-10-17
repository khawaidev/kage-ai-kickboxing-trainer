import { GoogleGenAI, Modality } from '@google/genai'
import { env } from './env.js'

const REST_BASE = 'https://generativelanguage.googleapis.com'

class GeminiHttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 408 || status >= 500
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Run an operation for each configured key in order. Retries with the
 * fallback key on rate-limit / server errors; key1 is primary.
 */
async function withKeys<T>(op: (apiKey: string) => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < env.geminiKeys.length; i++) {
    const apiKey = env.geminiKeys[i]
    try {
      return await op(apiKey)
    } catch (error) {
      lastError = error
      const status = error instanceof GeminiHttpError ? error.status : 0
      if (!isRetryable(status) || i === env.geminiKeys.length - 1) throw error
      // small backoff before failover
      await sleep(250)
    }
  }
  throw lastError
}

/* ------------------------------------------------------------------ *
 * Live API — ephemeral tokens (client connects directly to Gemini)     *
 * ------------------------------------------------------------------ */

export interface EphemeralTokenResult {
  token: string
  model: string
  expiresAt: string
}

export async function createEphemeralToken(): Promise<EphemeralTokenResult> {
  const model = env.liveModel
  const expireTime = new Date(Date.now() + 30 * 60 * 1000)
  const newSessionExpireTime = new Date(Date.now() + 1 * 60 * 1000)

  return withKeys(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } })
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: expireTime.toISOString(),
        newSessionExpireTime: newSessionExpireTime.toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            sessionResumption: {},
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    })
    if (!token.name) throw new Error('Gemini did not return an ephemeral token name.')
    return { token: token.name, model, expiresAt: expireTime.toISOString() }
  })
}

/* ------------------------------------------------------------------ *
 * Files API — upload a recording, wait until it is ACTIVE             *
 * ------------------------------------------------------------------ */

interface GeminiFile {
  name: string
  uri: string
  mimeType: string
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED'
}

export async function uploadFile(
  bytes: Uint8Array,
  mimeType: string,
  displayName: string,
  onProgress?: (fraction: number) => void,
): Promise<GeminiFile> {
  return withKeys(async (apiKey) => {
    const startRes = await fetch(`${REST_BASE}/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(bytes.byteLength),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    })
    if (!startRes.ok) {
      throw new GeminiHttpError(startRes.status, await startRes.text())
    }
    const uploadUrl = startRes.headers.get('x-goog-upload-url')
    if (!uploadUrl) throw new Error('No resumable upload URL returned by Gemini.')

    onProgress?.(0.15)
    const body = new Uint8Array(bytes)
    const finishRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(bytes.byteLength),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body,
    })
    if (!finishRes.ok) {
      throw new GeminiHttpError(finishRes.status, await finishRes.text())
    }
    const data = (await finishRes.json()) as { file: GeminiFile }
    onProgress?.(0.45)
    return data.file
  })
}

export async function waitForFileActive(
  fileName: string,
  onProgress?: (fraction: number) => void,
  timeoutMs = 120_000,
): Promise<GeminiFile> {
  return withKeys(async (apiKey) => {
    const startedAt = Date.now()
    for (;;) {
      const res = await fetch(`${REST_BASE}/v1beta/${fileName}?key=${apiKey}`)
      if (!res.ok) throw new GeminiHttpError(res.status, await res.text())
      const file = (await res.json()) as GeminiFile
      if (file.state === 'ACTIVE') return file
      if (file.state === 'FAILED') throw new Error('Gemini failed to process the recording.')
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error('Timed out waiting for Gemini to process the recording.')
      }
      onProgress?.(0.5)
      await sleep(2000)
    }
  })
}

/* ------------------------------------------------------------------ *
 * generateContent — structured JSON (analysis + chat)                 *
 * ------------------------------------------------------------------ */

export async function generateJson<T>(
  model: string,
  prompt: string,
  file?: { uri: string; mimeType: string },
  schema?: unknown,
): Promise<T> {
  return withKeys(async (apiKey) => {
    const parts: unknown[] = []
    if (file) parts.push({ fileData: { fileUri: file.uri, mimeType: file.mimeType } })
    parts.push({ text: prompt })

    const res = await fetch(
      `${REST_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            ...(schema ? { responseSchema: schema } : {}),
          },
        }),
      },
    )
    if (!res.ok) throw new GeminiHttpError(res.status, await res.text())
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim()
    if (!text) throw new Error('Gemini returned an empty response.')
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as T
  })
}

export async function generateText(model: string, prompt: string): Promise<string> {
  return withKeys(async (apiKey) => {
    const res = await fetch(
      `${REST_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      },
    )
    if (!res.ok) throw new GeminiHttpError(res.status, await res.text())
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    return (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim()
  })
}

export { GeminiHttpError }
