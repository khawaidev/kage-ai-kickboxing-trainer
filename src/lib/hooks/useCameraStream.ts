import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'error'
  | 'unsupported'

interface StartOptions {
  audio?: boolean
  facingMode?: 'user' | 'environment'
}

export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStream(null)
    setStatus('idle')
  }, [])

  const start = useCallback(async (options: StartOptions = {}): Promise<MediaStream | null> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus('unsupported')
      setError('Camera capture is not supported in this browser.')
      return null
    }
    setStatus('requesting')
    setError(null)
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode ?? 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: options.audio
          ? { echoCancellation: true, noiseSuppression: true }
          : false,
      })
      streamRef.current = media
      setStream(media)
      setStatus('ready')
      return media
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied')
        setError('Camera and microphone permission was denied.')
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setStatus('error')
        setError('No suitable camera was found on this device.')
      } else {
        setStatus('error')
        setError('The camera could not be started.')
      }
      return null
    }
  }, [])

  useEffect(() => stop, [stop])

  return { stream, status, error, start, stop }
}
