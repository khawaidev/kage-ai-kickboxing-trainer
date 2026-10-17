import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechSynthesis(enabled: boolean) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported) return
      try {
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 1.02
        utter.pitch = 1
        utter.volume = 1
        window.speechSynthesis.speak(utter)
      } catch {
        /* speech is best-effort */
      }
    },
    [enabled, supported],
  )

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  useEffect(() => cancel, [cancel])

  return { speak, cancel, supported }
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

export function useSpeechRecognition() {
  const RecognitionCtor =
    typeof window !== 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined
  const supported = Boolean(RecognitionCtor)

  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    if (!supported) return
    const recognition: SpeechRecognitionLike = new RecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event: unknown) => {
      const e = event as { results: ArrayLike<ArrayLike<{ transcript: string }>> }
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
      setTranscript(text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
    }
  }, [RecognitionCtor, supported])

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return
    setTranscript('')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [supported])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { supported, listening, transcript, start, stop }
}
