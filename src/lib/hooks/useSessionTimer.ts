import { useCallback, useEffect, useRef, useState } from 'react'

export type Phase = 'round' | 'rest' | 'complete'

export interface TimerState {
  elapsed: number
  currentRound: number
  totalRounds: number
  phase: Phase
  phaseRemaining: number
  phaseTotal: number
  isRunning: boolean
}

interface Options {
  rounds: number
  roundSeconds: number
  restSeconds: number
  onPhaseChange?: (phase: Phase, round: number) => void
}

export function useSessionTimer({
  rounds,
  roundSeconds,
  restSeconds,
  onPhaseChange,
}: Options) {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const accumRef = useRef(0)
  const lastPhaseRef = useRef<Phase | null>(null)

  useEffect(() => {
    if (!isRunning) return
    startedAtRef.current = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const base = accumRef.current
      const delta = Math.floor((now - (startedAtRef.current ?? now)) / 1000)
      setElapsed(base + delta)
    }, 250)
    return () => {
      if (startedAtRef.current) {
        accumRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
        startedAtRef.current = null
      }
      clearInterval(interval)
    }
  }, [isRunning])

  const cycle = roundSeconds + restSeconds
  const total = rounds * roundSeconds + Math.max(0, rounds - 1) * restSeconds

  let phase: Phase = 'round'
  let currentRound = 1
  let phaseRemaining = roundSeconds
  let phaseTotal = roundSeconds

  if (elapsed >= total) {
    phase = 'complete'
    currentRound = rounds
    phaseRemaining = 0
    phaseTotal = roundSeconds
  } else {
    const index = Math.floor(elapsed / cycle)
    const within = elapsed % cycle
    const isLastRound = index >= rounds - 1
    if (within < roundSeconds) {
      phase = 'round'
      currentRound = index + 1
      phaseRemaining = roundSeconds - within
      phaseTotal = roundSeconds
    } else if (isLastRound) {
      phase = 'round'
      currentRound = rounds
      phaseRemaining = 0
      phaseTotal = roundSeconds
    } else {
      phase = 'rest'
      currentRound = index + 1
      phaseRemaining = cycle - within
      phaseTotal = restSeconds
    }
  }

  useEffect(() => {
    if (lastPhaseRef.current !== phase) {
      lastPhaseRef.current = phase
      onPhaseChange?.(phase, currentRound)
    }
  }, [phase, currentRound, onPhaseChange])

  const start = useCallback(() => {
    accumRef.current = 0
    setElapsed(0)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => setIsRunning(false), [])
  const resume = useCallback(() => setIsRunning(true), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    accumRef.current = 0
    startedAtRef.current = null
    setElapsed(0)
    lastPhaseRef.current = null
  }, [])

  const state: TimerState = {
    elapsed,
    currentRound,
    totalRounds: rounds,
    phase,
    phaseRemaining,
    phaseTotal,
    isRunning,
  }

  return { ...state, start, pause, resume, reset, setElapsed }
}
