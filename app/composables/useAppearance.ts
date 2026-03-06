export type AppearanceMode = 'light' | 'dark'

const STORAGE_KEY = 'fd-appearance'

function isAppearanceMode(value: string | null): value is AppearanceMode {
  return value === 'light' || value === 'dark'
}

function applyAppearanceClass(mode: AppearanceMode) {
  if (!import.meta.client) {
    return
  }

  const root = document.documentElement
  root.classList.toggle('fd-theme-dark', mode === 'dark')
}

export function useAppearance() {
  const appearance = useState<AppearanceMode>('fd-appearance-mode', () => 'light')
  const initialized = useState('fd-appearance-initialized', () => false)

  if (import.meta.client && !initialized.value) {
    initialized.value = true

    const storedValue = window.localStorage.getItem(STORAGE_KEY)

    if (isAppearanceMode(storedValue)) {
      appearance.value = storedValue
    }

    watch(
      appearance,
      (nextAppearance) => {
        window.localStorage.setItem(STORAGE_KEY, nextAppearance)
        applyAppearanceClass(nextAppearance)
      },
      { immediate: true }
    )
  }

  function setAppearance(nextAppearance: AppearanceMode) {
    appearance.value = nextAppearance
  }

  return {
    appearance,
    setAppearance
  }
}
