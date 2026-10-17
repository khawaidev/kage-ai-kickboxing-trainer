import { create } from 'zustand'

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

interface CameraState {
  stream: MediaStream | null
  status: CameraStatus
  error: string | null
  start: (options?: StartOptions) => Promise<MediaStream | null>
  stop: () => void
}

/**
 * Camera source of truth held outside component trees so the stream survives
 * navigation between setup and the active workout (PRD §12: the workout is a
 * foreground experience).
 */
export const useCameraStore = create<CameraState>((set, get) => ({
  stream: null,
  status: 'idle',
  error: null,

  start: async (options = {}) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      set({ status: 'unsupported', error: 'Camera capture is not supported here.' })
      return null
    }
    get().stop()
    set({ status: 'requesting', error: null })
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
      set({ stream: media, status: 'ready' })
      return media
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        set({ status: 'denied', error: 'Camera and microphone permission was denied.' })
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        set({ status: 'error', error: 'No suitable camera was found on this device.' })
      } else {
        set({ status: 'error', error: 'The camera could not be started.' })
      }
      return null
    }
  },

  stop: () => {
    get().stream?.getTracks().forEach((t) => t.stop())
    set({ stream: null, status: 'idle' })
  },
}))
