import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createLiveCoach,
  type CoachMessage,
  type LiveCoachClient,
  type LiveCoachOptions,
  type LiveConnectionState,
} from '@/lib/services/liveCoach'
import { createGeminiLiveCoach } from '@/lib/services/geminiLive'
import { isSupabaseConfigured } from '@/lib/supabase/client'

function makeClient(): LiveCoachClient {
  if (isSupabaseConfigured && import.meta.env.MODE !== 'test') {
    return createGeminiLiveCoach()
  }
  return createLiveCoach()
}

export function useLiveCoach() {
  const clientRef = useRef<LiveCoachClient | null>(null)
  const [state, setState] = useState<LiveConnectionState>('idle')
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [latest, setLatest] = useState<CoachMessage | null>(null)
  const [muted, setMutedState] = useState(false)

  if (!clientRef.current) {
    clientRef.current = makeClient()
  }

  const nativeAudio = clientRef.current.nativeAudio

  useEffect(() => {
    const client = clientRef.current!
    const unsubState = client.onStateChange(setState)
    const unsubMsg = client.onMessage((m) => {
      setMessages((prev) => [...prev.slice(-40), m])
      setLatest(m)
    })
    return () => {
      unsubState()
      unsubMsg()
    }
  }, [])

  const connect = useCallback(async (options: LiveCoachOptions) => {
    setMessages([])
    setLatest(null)
    await clientRef.current!.connect(options)
  }, [])

  const disconnect = useCallback(async () => {
    await clientRef.current!.disconnect()
  }, [])

  const askQuestion = useCallback((q: string, atSeconds: number) => {
    clientRef.current!.askQuestion(q, atSeconds)
  }, [])

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m)
    clientRef.current!.setMuted(m)
  }, [])

  const simulateInterruption = useCallback(() => {
    clientRef.current!.simulateInterruption()
  }, [])

  return {
    state,
    messages,
    latest,
    muted,
    nativeAudio,
    connect,
    disconnect,
    askQuestion,
    setMuted,
    simulateInterruption,
  }
}
