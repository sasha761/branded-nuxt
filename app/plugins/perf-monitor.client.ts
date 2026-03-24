import type { RouteLocationNormalized } from 'vue-router'
import {
  hydratePerfMonitorState,
  persistPerfMonitorState,
  setPerfMonitorEnabled,
  usePerfMonitorState,
} from '~/composables/usePerfMonitor'
import {
  PERF_MONITOR_QUERY_PARAM,
  createMetricId,
  getCurrentPath,
  getRouteType,
  roundMs,
  type PerfInitialLoadMetric,
  type PerfNavigationMetric,
  type PerfResourceMetric,
} from '~/utils/perf-monitor'

interface ActiveNavigation {
  id: string
  startedAt: string
  from: string
  to: string
  fromType: string
  toType: string
  startMark: number
  loadingStartMark: number | null
  loadingEndMark: number | null
  suspenseStartMark: number | null
  finishMark: number | null
  finalizing: boolean
}

interface PerfMonitorRuntime {
  activeNavigation: ActiveNavigation | null
  initialLoadId: string | null
  latestLcpMs: number | null
  hooksRegistered: boolean
}

function afterPaint(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve(performance.now())
      })
    })
  })
}

function getResourcePath(name: string): string {
  try {
    const url = new URL(name, window.location.origin)
    return `${url.pathname}${url.search}`
  } catch {
    return name
  }
}

function collectRequestMetrics(startMark: number, endMark: number): PerfResourceMetric[] {
  return performance
    .getEntriesByType('resource')
    .filter((entry) => entry.entryType === 'resource')
    .map((entry) => entry as PerformanceResourceTiming)
    .filter((entry) => ['fetch', 'xmlhttprequest'].includes(entry.initiatorType))
    .filter((entry) => entry.startTime >= startMark - 1 && entry.startTime <= endMark + 1)
    .map((entry) => ({
      name: entry.name,
      path: getResourcePath(entry.name),
      duration: roundMs(entry.duration),
      initiatorType: entry.initiatorType,
      transferSize: typeof entry.transferSize === 'number' ? entry.transferSize : null,
    }))
    .sort((left, right) => (right.duration ?? 0) - (left.duration ?? 0))
}

function buildInitialLoadMetric(runtime: PerfMonitorRuntime): PerfInitialLoadMetric | null {
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

  if (!navigationEntry) {
    return null
  }

  const firstContentfulPaint = performance
    .getEntriesByName('first-contentful-paint')[0]

  return {
    id: runtime.initialLoadId ?? createMetricId('load'),
    path: getCurrentPath(),
    startedAt: new Date().toISOString(),
    navigationType: navigationEntry.type,
    ttfbMs: roundMs(navigationEntry.responseStart),
    domInteractiveMs: roundMs(navigationEntry.domInteractive),
    dclMs: roundMs(navigationEntry.domContentLoadedEventEnd),
    loadMs: roundMs(navigationEntry.loadEventEnd),
    fcpMs: roundMs(firstContentfulPaint?.startTime),
    lcpMs: roundMs(runtime.latestLcpMs),
  }
}

function createActiveNavigation(to: RouteLocationNormalized, from: RouteLocationNormalized): ActiveNavigation {
  return {
    id: createMetricId('nav'),
    startedAt: new Date().toISOString(),
    from: from.fullPath || getCurrentPath(),
    to: to.fullPath,
    fromType: getRouteType(from.fullPath || getCurrentPath()),
    toType: getRouteType(to.fullPath),
    startMark: performance.now(),
    loadingStartMark: null,
    loadingEndMark: null,
    suspenseStartMark: null,
    finishMark: null,
    finalizing: false,
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const state = hydratePerfMonitorState()
  const perfParam = new URLSearchParams(window.location.search).get(PERF_MONITOR_QUERY_PARAM)

  if (perfParam === '1') {
    setPerfMonitorEnabled(true)
  } else if (perfParam === '0') {
    setPerfMonitorEnabled(false)
  } else {
    persistPerfMonitorState()
  }

  const runtimeWindow = window as Window & { __NUXT_PERF_MONITOR__?: PerfMonitorRuntime }
  const runtime = runtimeWindow.__NUXT_PERF_MONITOR__ ??= {
    activeNavigation: null,
    initialLoadId: null,
    latestLcpMs: null,
    hooksRegistered: false,
  }

  if (runtime.hooksRegistered) {
    return
  }

  runtime.hooksRegistered = true

  const router = useRouter()

  const upsertInitialLoadMetric = () => {
    if (!state.value.enabled) {
      return
    }

    const metric = buildInitialLoadMetric(runtime)

    if (!metric) {
      return
    }

    runtime.initialLoadId = metric.id
    state.value.initialLoads = [
      metric,
      ...state.value.initialLoads.filter(item => item.id !== metric.id),
    ]
    persistPerfMonitorState()
  }

  const updateRecordedInitialLoadLcp = () => {
    if (!state.value.enabled || !runtime.initialLoadId) {
      return
    }

    const targetIndex = state.value.initialLoads.findIndex(item => item.id === runtime.initialLoadId)

    if (targetIndex === -1) {
      return
    }

    const nextLcpMs = roundMs(runtime.latestLcpMs)

    if (state.value.initialLoads[targetIndex].lcpMs === nextLcpMs) {
      return
    }

    state.value.initialLoads[targetIndex] = {
      ...state.value.initialLoads[targetIndex],
      lcpMs: nextLcpMs,
    }
    state.value.initialLoads = [...state.value.initialLoads]
    persistPerfMonitorState()
  }

  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const latestEntry = list.getEntries().at(-1)

        if (!latestEntry) {
          return
        }

        runtime.latestLcpMs = latestEntry.startTime
        updateRecordedInitialLoadLcp()
      })

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      const stopLcpObserver = () => {
        lcpObserver.disconnect()
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          stopLcpObserver()
        }
      }, { once: true })
    } catch {
      // Ignore unsupported observer errors.
    }
  }

  if (document.readyState === 'complete') {
    window.setTimeout(upsertInitialLoadMetric, 0)
  } else {
    window.addEventListener('load', () => {
      window.setTimeout(upsertInitialLoadMetric, 0)
    }, { once: true })
  }

  const finalizeNavigation = async () => {
    const snapshot = runtime.activeNavigation

    if (!snapshot || snapshot.finalizing) {
      return
    }

    snapshot.finalizing = true

    try {
      const paintMark = await afterPaint()

      if (!state.value.enabled) {
        return
      }

      const requests = collectRequestMetrics(snapshot.startMark, paintMark)
      const totalRequestDuration = requests.reduce((sum, request) => sum + (request.duration ?? 0), 0)
      const maxRequestDuration = requests.reduce((max, request) => Math.max(max, request.duration ?? 0), 0)

      const metric: PerfNavigationMetric = {
        id: snapshot.id,
        startedAt: snapshot.startedAt,
        from: snapshot.from,
        to: snapshot.to,
        fromType: snapshot.fromType,
        toType: snapshot.toType,
        resolvedMs: roundMs((snapshot.finishMark ?? snapshot.loadingEndMark) !== null
          ? (snapshot.finishMark ?? snapshot.loadingEndMark)! - snapshot.startMark
          : null),
        loadingMs: roundMs(
          snapshot.loadingStartMark !== null && snapshot.loadingEndMark !== null
            ? snapshot.loadingEndMark - snapshot.loadingStartMark
            : null,
        ),
        suspenseMs: roundMs(
          snapshot.suspenseStartMark !== null && snapshot.finishMark !== null
            ? snapshot.finishMark - snapshot.suspenseStartMark
            : null,
        ),
        totalMs: roundMs(paintMark - snapshot.startMark) ?? 0,
        requestCount: requests.length,
        requestTotalMs: roundMs(totalRequestDuration),
        requestMaxMs: roundMs(maxRequestDuration),
        requests,
      }

      state.value.navigations = [
        metric,
        ...state.value.navigations.filter(item => item.id !== metric.id),
      ]
      persistPerfMonitorState()
    } finally {
      if (runtime.activeNavigation?.id === snapshot.id) {
        runtime.activeNavigation = null
      }
    }
  }

  router.beforeEach((to, from) => {
    if (!state.value.enabled || to.fullPath === from.fullPath) {
      return
    }

    runtime.activeNavigation = createActiveNavigation(to, from)
  })

  router.afterEach((_to, _from, failure) => {
    if (failure) {
      runtime.activeNavigation = null
    }
  })

  router.onError(() => {
    runtime.activeNavigation = null
  })

  nuxtApp.hook('page:loading:start', () => {
    if (!state.value.enabled || !runtime.activeNavigation || runtime.activeNavigation.loadingStartMark !== null) {
      return
    }

    runtime.activeNavigation.loadingStartMark = performance.now()
  })

  nuxtApp.hook('page:start', () => {
    if (!state.value.enabled || !runtime.activeNavigation || runtime.activeNavigation.suspenseStartMark !== null) {
      return
    }

    runtime.activeNavigation.suspenseStartMark = performance.now()
  })

  nuxtApp.hook('page:finish', () => {
    if (!state.value.enabled || !runtime.activeNavigation || runtime.activeNavigation.finishMark !== null) {
      return
    }

    runtime.activeNavigation.finishMark = performance.now()
  })

  nuxtApp.hook('page:loading:end', () => {
    if (!state.value.enabled || !runtime.activeNavigation) {
      return
    }

    if (runtime.activeNavigation.loadingEndMark === null) {
      runtime.activeNavigation.loadingEndMark = performance.now()
    }

    void finalizeNavigation()
  })

  usePerfMonitorState()
})
