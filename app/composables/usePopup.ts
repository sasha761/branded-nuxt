import { ref, readonly } from 'vue'

interface PopupState {
  name: string | null
  data: any
}

const popupStates: Record<number, Ref<PopupState>> = {}

function getState(level: number) {
  if (!popupStates[level]) {
    popupStates[level] = ref<PopupState>({ name: null, data: null })
  }
  return popupStates[level]
}

export function usePopup(level: number = 1) {
  const state = getState(level)

  function open(name: string, data: any = {}) {
    state.value = { name, data }
  }

  function close() {
    state.value = { name: null, data: null }
  }

  function closeAll() {
    for (const key in popupStates) {
      popupStates[key].value = { name: null, data: null }
    }
  }

  return {
    popupState: readonly(state),
    open,
    close,
    closeAll,
  }
}
