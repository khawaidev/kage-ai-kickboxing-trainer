const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4;codecs=h264,aac',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
]

export interface RecorderSupport {
  supported: boolean
  mimeType: string | null
}

/**
 * Runtime MIME-type detection (PRD §12). Never assume every browser records
 * the same container/codec.
 */
export function detectRecorderSupport(): RecorderSupport {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { supported: false, mimeType: null }
  }
  for (const mimeType of CANDIDATE_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return { supported: true, mimeType }
      }
    } catch {
      /* ignore */
    }
  }
  // MediaRecorder exists but exposes no isTypeSupported result: allow default.
  return { supported: true, mimeType: null }
}

export function extensionForMime(mimeType: string | null): string {
  if (!mimeType) return 'webm'
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('webm')) return 'webm'
  return 'webm'
}
