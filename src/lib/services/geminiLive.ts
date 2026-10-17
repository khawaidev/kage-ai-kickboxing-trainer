import { apiUrl } from '@/lib/api'
import { getAccessToken } from '@/lib/supabase/client'
import {
  MockLiveCoach,
  type CoachMessage,
  type LiveCoachClient,
  type LiveCoachOptions,
  type LiveConnectionState,
} from '@/lib/services/liveCoach'

type Unsubscribe = () => void

interface LiveSession {
  sendRealtimeInput: (params: unknown) => void
  sendClientContent: (params: unknown) => void
  close: () => void
}

interface TokenResponse {
  token: string
  model: string
  expiresAt: string
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 12)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  return bytesToBase64(new Uint8Array(buf))
}

async function fetchToken(): Promise<TokenResponse> {
  const accessToken = await getAccessToken()
  const res = await fetch(apiUrl('/api/live-token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`Live token request failed (${res.status})`)
  return (await res.json()) as TokenResponse
}

const SYSTEM_INSTRUCTION = (o: LiveCoachOptions) =>
  [
    'You are KAGE, a concise boxing/kickboxing coach watching a live training session.',
    `Sport: ${o.sport}. Level: ${o.level}. Focus: ${o.focus.replace('_', ' ')}.`,
    `Coaching frequency: ${o.frequency}. Speak in short, single-sentence corrections.`,
    'Do not narrate continuously. Encourage rest during rest periods and answer direct questions.',
    'You are an AI and can be wrong; never give medical advice.',
  ].join(' ')

/**
 * GeminiLiveCoach — real bidirectional Gemini 3.8 Live session opened in the
 * browser using a short-lived token minted by the BFF. If anything in the
 * setup fails (no server, no mic, model error) it transparently falls back to
 * the scripted MockLiveCoach so the workout is never interrupted.
 */
export class GeminiLiveCoach implements LiveCoachClient {
  readonly nativeAudio = true

  private state: LiveConnectionState = 'idle'
  private stateListeners = new Set<(s: LiveConnectionState) => void>()
  private messageListeners = new Set<(m: CoachMessage) => void>()
  private startedAt = 0
  private muted = false
  private paused = false

  private fallback: MockLiveCoach | null = null
  private session: LiveSession | null = null
  private audioCtx: AudioContext | null = null
  private playCtx: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private videoTimer: ReturnType<typeof setInterval> | null = null
  private videoEl: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private playCursor = 0

  getState(): LiveConnectionState {
    return this.fallback ? this.fallback.getState() : this.state
  }

  onStateChange(cb: (s: LiveConnectionState) => void): Unsubscribe {
    this.stateListeners.add(cb)
    return () => this.stateListeners.delete(cb)
  }

  onMessage(cb: (m: CoachMessage) => void): Unsubscribe {
    this.messageListeners.add(cb)
    return () => this.messageListeners.delete(cb)
  }

  private setState(state: LiveConnectionState) {
    this.state = state
    this.stateListeners.forEach((cb) => cb(state))
  }

  private emit(message: CoachMessage) {
    this.messageListeners.forEach((cb) => cb(message))
  }

  private elapsed(): number {
    return this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0
  }

  private useFallback(): void {
    if (this.fallback) return
    const mock = new MockLiveCoach()
    this.fallback = mock
    mock.onStateChange((s) => this.stateListeners.forEach((cb) => cb(s)))
    mock.onMessage((m) => this.messageListeners.forEach((cb) => cb(m)))
  }

  async connect(options: LiveCoachOptions): Promise<void> {
    this.setState('connecting')
    try {
      const token = await fetchToken()
      const { GoogleGenAI, Modality } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: token.token })
      const session = await ai.live.connect({
        model: token.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION(options) }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            this.startedAt = Date.now()
            this.setState('connected')
          },
          onmessage: (msg: unknown) => this.handleMessage(msg),
          onerror: () => {
            if (!this.fallback) this.setState('error')
          },
          onclose: () => {
            if (!this.fallback) this.setState('closed')
          },
        },
      })
      this.session = session as unknown as LiveSession
      this.startMic(options.stream)
      this.startVideo(options.stream)
    } catch (error) {
      console.warn('[kage] Gemini Live unavailable, using scripted coach', error)
      this.useFallback()
      await this.fallback!.connect(options)
    }
  }

  private handleMessage(msg: unknown): void {
    const m = msg as {
      text?: string
      data?: string
      serverContent?: {
        outputTranscription?: { text?: string }
        turnComplete?: boolean
      }
    }
    if (m.data) this.playAudio(m.data)
    const text = m.serverContent?.outputTranscription?.text ?? m.text
    if (text && text.trim()) {
      this.emit({
        id: makeId(),
        text: text.trim(),
        kind: 'correction',
        at_seconds: this.elapsed(),
        created_at: new Date().toISOString(),
      })
    }
  }

  private startMic(stream?: MediaStream): void {
    if (!stream || stream.getAudioTracks().length === 0) return
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx({ sampleRate: 16000 })
    this.audioCtx = ctx
    const source = ctx.createMediaStreamSource(stream)
    this.sourceNode = source
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    this.processor = processor
    processor.onaudioprocess = (e) => {
      if (this.muted || this.paused || !this.session) return
      const input = e.inputBuffer.getChannelData(0)
      const pcm = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff
      }
      this.session.sendRealtimeInput({
        media: { data: bytesToBase64(new Uint8Array(pcm.buffer)), mimeType: 'audio/pcm;rate=16000' },
      })
    }
    source.connect(processor)
    processor.connect(ctx.destination)
  }

  private startVideo(stream?: MediaStream): void {
    if (!stream || stream.getVideoTracks().length === 0) return
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    void video.play().catch(() => undefined)
    this.videoEl = video
    const canvas = document.createElement('canvas')
    this.canvas = canvas
    this.videoTimer = setInterval(() => void this.sendVideoFrame(), 1000)
  }

  private async sendVideoFrame(): Promise<void> {
    if (!this.session || this.paused || !this.videoEl || !this.canvas) return
    const v = this.videoEl
    if (!v.videoWidth) return
    const scale = Math.min(1, 640 / v.videoWidth)
    this.canvas.width = Math.round(v.videoWidth * scale)
    this.canvas.height = Math.round(v.videoHeight * scale)
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0, this.canvas.width, this.canvas.height)
    const blob: Blob | null = await new Promise((resolve) =>
      this.canvas!.toBlob((b) => resolve(b), 'image/jpeg', 0.6),
    )
    if (!blob) return
    const data = await blobToBase64(blob)
    this.session.sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } })
  }

  private playAudio(base64: string): void {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!this.playCtx) this.playCtx = new Ctx({ sampleRate: 24000 })
    const ctx = this.playCtx
    const bytes = base64ToBytes(base64)
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2))
    const buffer = ctx.createBuffer(1, samples.length, 24000)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 0x8000
    const node = ctx.createBufferSource()
    node.buffer = buffer
    node.connect(ctx.destination)
    const start = Math.max(ctx.currentTime, this.playCursor)
    node.start(start)
    this.playCursor = start + buffer.duration
  }

  sendFrame(frame: Blob): void {
    if (!this.session) return
    void blobToBase64(frame).then((data) =>
      this.session?.sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } }),
    )
  }

  askQuestion(question: string): void {
    if (this.fallback) return this.fallback.askQuestion(question, this.elapsed())
    if (!this.session) return
    this.session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text: question }] }],
      turnComplete: true,
    })
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.fallback?.setMuted(muted)
  }

  pause(): void {
    this.paused = true
    this.fallback?.pause()
  }

  resume(): void {
    this.paused = false
    this.fallback?.resume()
  }

  simulateInterruption(): void {
    if (this.fallback) return this.fallback.simulateInterruption()
    this.setState('reconnecting')
    setTimeout(() => {
      if (this.state === 'reconnecting') this.setState('connected')
    }, 2500)
  }

  async disconnect(): Promise<void> {
    if (this.videoTimer) clearInterval(this.videoTimer)
    this.videoTimer = null
    try {
      this.processor?.disconnect()
      this.sourceNode?.disconnect()
      await this.audioCtx?.close()
      await this.playCtx?.close()
    } catch {
      /* ignore teardown errors */
    }
    try {
      this.session?.close()
    } catch {
      /* ignore */
    }
    this.session = null
    if (this.fallback) return this.fallback.disconnect()
    this.setState('closed')
  }
}

export function createGeminiLiveCoach(): LiveCoachClient {
  return new GeminiLiveCoach()
}
