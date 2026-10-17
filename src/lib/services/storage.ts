import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface RecordedBlob {
  session_id: string
  blob: Blob
  mime_type: string
  size_bytes: number
  duration_seconds: number
  created_at: string
}

interface KageDB extends DBSchema {
  recordings: {
    key: string
    value: RecordedBlob
  }
}

const DB_NAME = 'kage-recordings'
const DB_VERSION = 1
let dbPromise: Promise<IDBPDatabase<KageDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<KageDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'session_id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveRecording(
  sessionId: string,
  blob: Blob,
  durationSeconds: number,
): Promise<void> {
  const db = await getDb()
  await db.put('recordings', {
    session_id: sessionId,
    blob,
    mime_type: blob.type || 'video/webm',
    size_bytes: blob.size,
    duration_seconds: durationSeconds,
    created_at: new Date().toISOString(),
  })
}

export async function getRecording(sessionId: string): Promise<RecordedBlob | undefined> {
  const db = await getDb()
  return db.get('recordings', sessionId)
}

export async function deleteRecording(sessionId: string): Promise<void> {
  const db = await getDb()
  await db.delete('recordings', sessionId)
}

export async function listRecordingIds(): Promise<string[]> {
  const db = await getDb()
  return db.getAllKeys('recordings')
}

export interface StorageEstimate {
  usage: number
  quota: number
  supported: boolean
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, supported: false }
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota, supported: true }
}

/**
 * Conservative pre-flight check (PRD §12). A 15-minute 720p recording is
 * approximated at ~1.2 MB/s; we require that much headroom plus a buffer.
 */
export async function hasSufficientStorage(plannedSeconds: number): Promise<boolean> {
  const estimate = await getStorageEstimate()
  if (!estimate.supported || estimate.quota === 0) return true
  const estimatedBytes = plannedSeconds * 1.2 * 1024 * 1024
  const available = estimate.quota - estimate.usage
  return available > estimatedBytes * 1.25
}

export async function isRecordingStored(sessionId: string): Promise<boolean> {
  const db = await getDb()
  const key = await db.getKey('recordings', sessionId)
  return key !== undefined
}
