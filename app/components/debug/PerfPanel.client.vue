<template>
  <aside v-if="state.enabled" class="perf-panel">
    <div class="perf-panel__header">
      <div>
        <div class="perf-panel__title">Nuxt Perf Monitor</div>
        <div class="perf-panel__hint">Enable with ?perf=1</div>
      </div>

      <div class="perf-panel__actions">
        <button type="button" class="perf-panel__button" @click="copyReport">
          {{ copyLabel }}
        </button>
        <button type="button" class="perf-panel__button" @click="clearMetrics">
          Clear
        </button>
        <button type="button" class="perf-panel__button perf-panel__button--danger" @click="disableMonitor">
          Disable
        </button>
      </div>
    </div>

    <section v-if="latestInitialLoad" class="perf-section">
      <div class="perf-section__title">Initial Load</div>
      <div class="perf-metrics">
        <span>TTFB {{ formatMs(latestInitialLoad.ttfbMs) }}</span>
        <span>FCP {{ formatMs(latestInitialLoad.fcpMs) }}</span>
        <span>LCP {{ formatMs(latestInitialLoad.lcpMs) }}</span>
        <span>DCL {{ formatMs(latestInitialLoad.dclMs) }}</span>
        <span>Load {{ formatMs(latestInitialLoad.loadMs) }}</span>
      </div>
      <div class="perf-path">{{ latestInitialLoad.path }}</div>
    </section>

    <section v-if="pairSummaries.length" class="perf-section">
      <div class="perf-section__title">Route Pairs</div>
      <div class="perf-summary" v-for="item in pairSummaries" :key="item.label">
        <div class="perf-summary__top">
          <strong>{{ item.label }}</strong>
          <span>{{ item.count }}x</span>
        </div>
        <div class="perf-summary__meta">
          <span>avg {{ formatMs(item.avgMs) }}</span>
          <span>max {{ formatMs(item.maxMs) }}</span>
        </div>
      </div>
    </section>

    <section class="perf-section">
      <div class="perf-section__title">Recent Navigations</div>

      <div v-if="recentNavigations.length" class="perf-list">
        <article v-for="item in recentNavigations" :key="item.id" class="perf-item">
          <div class="perf-item__top">
            <strong>{{ item.fromType }} -> {{ item.toType }}</strong>
            <span>{{ formatMs(item.totalMs) }}</span>
          </div>

          <div class="perf-path">{{ item.from }} -> {{ item.to }}</div>

          <div class="perf-metrics">
            <span>resolved {{ formatMs(item.resolvedMs) }}</span>
            <span>loading {{ formatMs(item.loadingMs) }}</span>
            <span>suspense {{ formatMs(item.suspenseMs) }}</span>
            <span>fetches {{ item.requestCount }}</span>
            <span>fetch total {{ formatMs(item.requestTotalMs) }}</span>
            <span>fetch max {{ formatMs(item.requestMaxMs) }}</span>
          </div>

          <div v-if="item.requests.length" class="perf-requests">
            <div
              v-for="request in item.requests.slice(0, 3)"
              :key="`${item.id}-${request.name}`"
              class="perf-request"
            >
              <span>{{ request.path }}</span>
              <span>{{ formatMs(request.duration) }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="perf-empty">
        No SPA navigations recorded yet.
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { clearPerfMonitorMetrics, setPerfMonitorEnabled, usePerfMonitorState } from '~/composables/usePerfMonitor'
import { PERF_MONITOR_QUERY_PARAM } from '~/utils/perf-monitor'

const state = usePerfMonitorState()
const route = useRoute()
const router = useRouter()
const copyLabel = ref('Copy JSON')

const latestInitialLoad = computed(() => state.value.initialLoads[0] ?? null)
const recentNavigations = computed(() => state.value.navigations.slice(0, 12))

const pairSummaries = computed(() => {
  const grouped = new Map<string, { label: string, count: number, totalMs: number, maxMs: number }>()

  for (const item of state.value.navigations) {
    const label = `${item.fromType} -> ${item.toType}`
    const current = grouped.get(label)

    if (current) {
      current.count += 1
      current.totalMs += item.totalMs
      current.maxMs = Math.max(current.maxMs, item.totalMs)
      continue
    }

    grouped.set(label, {
      label,
      count: 1,
      totalMs: item.totalMs,
      maxMs: item.totalMs,
    })
  }

  return [...grouped.values()]
    .map(item => ({
      ...item,
      avgMs: item.totalMs / item.count,
    }))
    .sort((left, right) => right.count - left.count || right.avgMs - left.avgMs)
    .slice(0, 6)
})

function formatMs(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return `${value.toFixed(1)} ms`
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(state.value, null, 2))
    copyLabel.value = 'Copied'
  } catch {
    copyLabel.value = 'Copy failed'
  }

  window.setTimeout(() => {
    copyLabel.value = 'Copy JSON'
  }, 1500)
}

function clearMetrics() {
  clearPerfMonitorMetrics()
}

async function disableMonitor() {
  setPerfMonitorEnabled(false)

  const nextQuery = { ...route.query }
  delete nextQuery[PERF_MONITOR_QUERY_PARAM]

  await router.replace({ query: nextQuery })
}
</script>

<style scoped lang="scss">
.perf-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  width: min(460px, calc(100vw - 32px));
  max-height: min(80vh, 860px);
  overflow: auto;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(14, 19, 28, 0.94);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  color: #f4f7fb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.45;
  backdrop-filter: blur(10px);
}

.perf-panel__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.perf-panel__title {
  font-size: 13px;
  font-weight: 700;
}

.perf-panel__hint {
  margin-top: 3px;
  color: rgba(244, 247, 251, 0.72);
}

.perf-panel__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.perf-panel__button {
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.perf-panel__button--danger {
  border-color: rgba(255, 120, 120, 0.32);
  color: #ffb0b0;
}

.perf-section + .perf-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.perf-section__title {
  margin-bottom: 8px;
  color: rgba(244, 247, 251, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.perf-list {
  display: grid;
  gap: 8px;
}

.perf-item,
.perf-summary {
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.perf-item__top,
.perf-summary__top,
.perf-request {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.perf-summary__meta,
.perf-metrics {
  display: flex;
  gap: 6px 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  color: rgba(244, 247, 251, 0.8);
}

.perf-path {
  margin-top: 6px;
  color: #94d7ff;
  word-break: break-word;
}

.perf-requests {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.perf-request {
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  color: rgba(244, 247, 251, 0.82);
}

.perf-empty {
  color: rgba(244, 247, 251, 0.72);
}

@media (max-width: 640px) {
  .perf-panel {
    right: 10px;
    bottom: 10px;
    width: calc(100vw - 20px);
    max-height: 72vh;
    padding: 12px;
  }
}
</style>
