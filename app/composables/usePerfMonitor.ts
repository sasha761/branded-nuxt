import {
  PERF_MONITOR_DATA_KEY,
  PERF_MONITOR_FLAG_KEY,
  createEmptyPerfMonitorState,
  normalizePerfMonitorState,
  sanitizePerfMonitorState,
  type PerfMonitorState,
} from '~/utils/perf-monitor'

export function usePerfMonitorState() {
  return useState<PerfMonitorState>('perf-monitor-state', () => createEmptyPerfMonitorState())
}

export function hydratePerfMonitorState() {
  if (import.meta.server) {
    return usePerfMonitorState()
  }

  const state = usePerfMonitorState()

  try {
    const rawState = localStorage.getItem(PERF_MONITOR_DATA_KEY)

    if (rawState) {
      state.value = sanitizePerfMonitorState(JSON.parse(rawState))
    }
  } catch {
    state.value = createEmptyPerfMonitorState()
  }

  if (localStorage.getItem(PERF_MONITOR_FLAG_KEY) === '1') {
    state.value.enabled = true
  }

  state.value = normalizePerfMonitorState(state.value)

  return state
}

export function persistPerfMonitorState() {
  if (import.meta.server) {
    return
  }

  const state = usePerfMonitorState()
  state.value = normalizePerfMonitorState(state.value)

  localStorage.setItem(PERF_MONITOR_DATA_KEY, JSON.stringify(state.value))

  if (state.value.enabled) {
    localStorage.setItem(PERF_MONITOR_FLAG_KEY, '1')
  } else {
    localStorage.removeItem(PERF_MONITOR_FLAG_KEY)
  }
}

export function setPerfMonitorEnabled(enabled: boolean) {
  const state = usePerfMonitorState()
  state.value = normalizePerfMonitorState({
    ...state.value,
    enabled,
  })

  persistPerfMonitorState()
}

export function clearPerfMonitorMetrics() {
  const state = usePerfMonitorState()

  state.value = {
    ...createEmptyPerfMonitorState(),
    enabled: state.value.enabled,
  }

  persistPerfMonitorState()
}
