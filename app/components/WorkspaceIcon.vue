<script setup lang="ts">
defineProps<{
  name:
    | 'audit'
    | 'back'
    | 'chevron'
    | 'close'
    | 'collapse-all'
    | 'delete'
    | 'edit'
    | 'expand-all'
    | 'export'
    | 'file'
    | 'folder-closed'
    | 'folder-open'
    | 'fullscreen'
    | 'github'
    | 'home'
    | 'info'
    | 'install'
    | 'markdown'
    | 'more'
    | 'move'
    | 'pdf'
    | 'plus-file'
    | 'plus-folder'
    | 'save'
    | 'settings'
    | 'share'
    | 'logout'
    | 'users'
    | 'voice'
    | 'word'
}>()
</script>

<template>
  <svg
    v-if="name === 'back'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M19 12H5" />
    <path d="m10.5 6.5-5.5 5.5 5.5 5.5" />
  </svg>

  <svg
    v-else-if="name === 'audit'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M6.5 5.5h11A1.5 1.5 0 0 1 19 7v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17V7a1.5 1.5 0 0 1 1.5-1.5Z"
    />
    <path d="M8.5 9h7" />
    <path d="M8.5 12h7" />
    <path d="M8.5 15h4" />
  </svg>

  <svg
    v-else-if="name === 'github'"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.01c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.1-.74.08-.72.08-.72 1.2.09 1.84 1.24 1.84 1.24 1.08 1.85 2.83 1.32 3.52 1 .1-.78.42-1.32.76-1.62-2.66-.31-5.47-1.33-5.47-5.91 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.57.12-3.27 0 0 1.01-.33 3.3 1.23a11.33 11.33 0 0 1 6 0c2.29-1.56 3.3-1.23 3.3-1.23.66 1.7.24 2.96.12 3.27.77.84 1.24 1.91 1.24 3.22 0 4.59-2.81 5.6-5.49 5.91.43.37.82 1.1.82 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"
    />
  </svg>

  <svg
    v-else-if="name === 'home'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m4.5 10.5 7.5-6 7.5 6" />
    <path d="M6.5 9.5V19h11V9.5" />
    <path d="M10 19v-5h4v5" />
  </svg>

  <svg
    v-else-if="name === 'close'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m7 7 10 10" />
    <path d="M17 7 7 17" />
  </svg>

  <svg
    v-else-if="name === 'plus-file'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
    />
    <path d="M14 3.5V8h4" />
    <path d="M9 14h6" />
    <path d="M12 11v6" />
  </svg>

  <svg
    v-else-if="name === 'plus-folder'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.8 2H19.5A1.5 1.5 0 0 1 21 9.5v7A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5Z"
    />
    <path d="M12 10.5v5" />
    <path d="M9.5 13h5" />
  </svg>

  <svg
    v-else-if="name === 'file'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
    />
    <path d="M14 3.5V8h4" />
    <path d="M8.5 12.5h7" />
    <path d="M8.5 16h7" />
  </svg>

  <svg
    v-else-if="name === 'folder-closed'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.8 2H19.5A1.5 1.5 0 0 1 21 9.5v7A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5Z"
    />
  </svg>

  <svg
    v-else-if="name === 'folder-open'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M3 8.5A1.5 1.5 0 0 1 4.5 7h4l1.8 2H19a1.5 1.5 0 0 1 1.44 1.92l-1.36 4.75A1.5 1.5 0 0 1 17.63 17H5a1.5 1.5 0 0 1-1.45-1.88Z"
    />
  </svg>

  <svg
    v-else-if="name === 'expand-all'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m8 7 4 4 4-4" />
    <path d="m8 13 4 4 4-4" />
  </svg>

  <svg
    v-else-if="name === 'collapse-all'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m8 11 4-4 4 4" />
    <path d="m8 17 4-4 4 4" />
  </svg>

  <svg
    v-else-if="name === 'move'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 4v16" />
    <path d="m8.5 7.5 3.5-3.5 3.5 3.5" />
    <path d="m8.5 16.5 3.5 3.5 3.5-3.5" />
    <path d="M4 12h16" />
    <path d="m7.5 8.5-3.5 3.5 3.5 3.5" />
    <path d="m16.5 8.5 3.5 3.5-3.5 3.5" />
  </svg>

  <svg
    v-else-if="name === 'edit'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5Z" />
    <path d="m12.5 7 4.5 4.5" />
  </svg>

  <svg
    v-else-if="name === 'delete'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 7h15" />
    <path d="M9 3.5h6" />
    <path
      d="M7 7l1 12.5A1.5 1.5 0 0 0 9.49 21h5.02A1.5 1.5 0 0 0 16 19.5L17 7"
    />
    <path d="M10 10.5v6" />
    <path d="M14 10.5v6" />
  </svg>

  <svg
    v-else-if="name === 'fullscreen'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M8 4H4v4" />
    <path d="M16 4h4v4" />
    <path d="M4 16v4h4" />
    <path d="M20 16v4h-4" />
    <path d="M9 9 4 4" />
    <path d="m15 9 5-5" />
    <path d="m9 15-5 5" />
    <path d="m15 15 5 5" />
  </svg>

  <svg
    v-else-if="name === 'export'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 4v11" />
    <path d="m8.5 11.5 3.5 3.5 3.5-3.5" />
    <path d="M5 18.5h14" />
  </svg>

  <svg
    v-else-if="name === 'info'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 10.4v5.1" />
    <circle cx="12" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>

  <svg
    v-else-if="name === 'install'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 4v10" />
    <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
    <path d="M5 18.5h14" />
  </svg>

  <svg
    v-else-if="name === 'markdown'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6.5h16v11H4Z" />
    <path d="M7.5 15V9l2.2 2.8L12 9v6" />
    <path d="M15 9v4" />
    <path d="m15 13 2 2 2-2" />
  </svg>

  <svg
    v-else-if="name === 'more'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>

  <svg
    v-else-if="name === 'pdf'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
    />
    <path d="M14 3.5V8h4" />
    <path d="M8.5 16.5v-4h1.7a1.3 1.3 0 0 1 0 2.6H8.5" />
    <path d="M13 16.5v-4h1.2a1.7 1.7 0 0 1 0 3.4H13" />
    <path d="M17 16.5v-4h2.2" />
    <path d="M17 14.5h1.7" />
  </svg>

  <svg
    v-else-if="name === 'save'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M5 4.5h11l3 3V19.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5Z"
    />
    <path d="M8 4.5v5h7v-5" />
    <path d="M8 21v-6h8v6" />
  </svg>

  <svg
    v-else-if="name === 'settings'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="2.6" />
    <path
      d="m12 4 1.6.4.8 1.5 1.7.2 1.3 1.2-.2 1.7 1 1.4-.8 1.6.8 1.6-1 1.4.2 1.7-1.3 1.2-1.7.2-.8 1.5L12 20l-1.6-.4-.8-1.5-1.7-.2-1.3-1.2.2-1.7-1-1.4.8-1.6-.8-1.6 1-1.4-.2-1.7 1.3-1.2 1.7-.2.8-1.5Z"
    />
  </svg>

  <svg
    v-else-if="name === 'users'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="9" cy="8.2" r="2.7" />
    <path d="M4.8 18.2a4.2 4.2 0 0 1 8.4 0" />
    <circle cx="16.6" cy="9.4" r="2.2" />
    <path d="M14.8 18.2a3.6 3.6 0 0 1 4.4-3.5 3.6 3.6 0 0 1 0 3.5" />
  </svg>

  <svg
    v-else-if="name === 'share'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="6" cy="12" r="2.25" />
    <circle cx="18" cy="6" r="2.25" />
    <circle cx="18" cy="18" r="2.25" />
    <path d="M8 11l7.6-4" />
    <path d="m8 13 7.6 4" />
  </svg>

  <svg
    v-else-if="name === 'logout'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M14.5 8.5 19 12l-4.5 3.5" />
    <path d="M10.5 12H19" />
  </svg>

  <svg
    v-else-if="name === 'voice'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="4.5" width="6" height="10" rx="3" />
    <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
    <path d="M12 17v3.5" />
    <path d="M9.5 20.5h5" />
  </svg>

  <svg
    v-else-if="name === 'word'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
    />
    <path d="M14 3.5V8h4" />
    <path d="m8.5 12.5 1.3 4 1.2-3 1.2 3 1.3-4" />
    <path d="M15.8 12.5h.2" />
  </svg>

  <svg
    v-else-if="name === 'chevron'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
</template>
