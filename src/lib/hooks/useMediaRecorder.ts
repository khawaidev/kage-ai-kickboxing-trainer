import { useCallback, useEffect, useRef, useState } from 'react'
import { detectRecorderSupport, extensionForMime } from '@/lib/utils/media'

export interface RecordedClip {
  blob: Blob
  url: string
  mimeType: string
  sizeBytes: number
  extension: string
}

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [clip, setClip] = useState<RecordedClip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clipUrlRef = useRef<string | null>(null)
  const clipRef = useRef<RecordedClip | null>(null)

  const support = detectRecorderSupport()

  const cleanupUrl = useCallback(() => {
    if (clipUrlRef.current) {
      URL.revokeObjectURL(clipUrlRef.current)
      clipUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      cleanupUrl()
    }
  }, [cleanupUrl])

  const start = useCallback(
    (stream: MediaStream): boolean => {
      if (!support.supported) {
        setError('Video recording is not supported in this browser.')
        return false
      }
      setError(null)
      setClip(null)
      clipRef.current = null
      cleanupUrl()
      chunksRef.current = []

      try {
        const recorder = support.mimeType
          ? new MediaRecorder(stream, { mimeType: support.mimeType })
          : new MediaRecorder(stream)

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.onerror = () => {
          setError('Recording stopped unexpectedly.')
          setIsRecording(false)
        }
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || support.mimeType || 'video/webm'
          const blob = new Blob(chunksRef.current, { type: mimeType })
          const url = URL.createObjectURL(blob)
          clipUrlRef.current = url
          const recorded: RecordedClip = {
            blob,
            url,
            mimeType,
            sizeBytes: blob.size,
            extension: extensionForMime(mimeType),
          }
          clipRef.current = recorded
          setClip(recorded)
          setIsRecording(false)
        }

        recorder.start(1000)
        recorderRef.current = recorder
        setElapsed(0)
        setIsRecording(true)
        timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
        return true
      } catch {
        setError('Recording could not be started on this device.')
        return false
      }
    },
    [support.supported, support.mimeType, cleanupUrl],
  )

  const stop = useCallback((): Promise<RecordedClip | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) clearInterval(timerRef.current)
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.addEventListener(
          'stop',
          () => resolve(clipRef.current),
          { once: true },
        )
        recorder.stop()
      } else {
        resolve(clipRef.current)
      }
    })
  }, [])

  const reset = useCallback(() => {
    setClip(null)
    clipRef.current = null
    setError(null)
    setElapsed(0)
    cleanupUrl()
  }, [cleanupUrl])

  return {
    isRecording,
    clip,
    error,
    elapsed,
    support,
    start,
    stop,
    reset,
  }
}
