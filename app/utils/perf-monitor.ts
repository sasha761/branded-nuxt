export const PERF_MONITOR_FLAG_KEY = 'nuxt-perf-monitor-enabled'
export const PERF_MONITOR_DATA_KEY = 'nuxt-perf-monitor-data'
export const PERF_MONITOR_QUERY_PARAM = 'perf'

const MAX_INITIAL_LOADS = 10
const MAX_NAVIGATIONS = 100
const KNOWN_LOCALES = new Set(['ru', 'uk'])

export interface PerfResourceMetric {
  name: string
  path: string
  duration: number | null
  initiatorType: string
  transferSize: number | null
}

export interface PerfInitialLoadMetric {
  id: string
  path: string
  startedAt: string
  navigationType: string
  ttfbMs: number | null
  domInteractiveMs: number | null
  dclMs: number | null
  loadMs: number | null
  fcpMs: number | null
  lcpMs: number | null
}

export interface PerfNavigationMetric {
  id: string
  startedAt: string
  from: string
  to: string
  fromType: string
  toType: string
  resolvedMs: number | null
  loadingMs: number | null
  suspenseMs: number | null
  totalMs: number
  requestCount: number
  requestTotalMs: number | null
  requestMaxMs: number | null
  requests: PerfResourceMetric[]
}

export interface PerfMonitorState {
  enabled: boolean
  initialLoads: PerfInitialLoadMetric[]
  navigations: PerfNavigationMetric[]
}

export function createEmptyPerfMonitorState(): PerfMonitorState {
  return {
    enabled: false,
    initialLoads: [],
    navigations: [],
  }
}

export function createMetricId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function roundMs(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.round(value * 10) / 10
}

export function normalizePerfMonitorState(state: PerfMonitorState): PerfMonitorState {
  return {
    enabled: Boolean(state.enabled),
    initialLoads: [...state.initialLoads].slice(0, MAX_INITIAL_LOADS),
    navigations: [...state.navigations].slice(0, MAX_NAVIGATIONS),
  }
}

export function sanitizePerfMonitorState(value: unknown): PerfMonitorState {
  if (!value || typeof value !== 'object') {
    return createEmptyPerfMonitorState()
  }

  const source = value as Partial<PerfMonitorState>

  return normalizePerfMonitorState({
    enabled: source.enabled === true,
    initialLoads: Array.isArray(source.initialLoads) ? source.initialLoads as PerfInitialLoadMetric[] : [],
    navigations: Array.isArray(source.navigations) ? source.navigations as PerfNavigationMetric[] : [],
  })
}

export function getRouteType(fullPath: string): string {
  const segments = getNormalizedSegments(fullPath)

  if (segments.length === 0) {
    return 'home'
  }

  switch (segments[0]) {
    case 'product-category':
      return 'category'
    case 'product':
      return 'product'
    case 'brand':
      return 'brand'
    case 'cart':
      return 'cart'
    case 'checkout-2':
      return 'checkout'
    case 'order-received':
      return 'order'
    default:
      return 'page'
  }
}

export function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  return `${window.location.pathname}${window.location.search}`
}

function getNormalizedSegments(fullPath: string): string[] {
  const path = fullPath.split('#')[0]?.split('?')[0] || '/'
  const segments = path.split('/').filter(Boolean)

  if (segments.length > 0 && KNOWN_LOCALES.has(segments[0])) {
    return segments.slice(1)
  }

  return segments
}
