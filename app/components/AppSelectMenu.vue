<script setup lang="ts">
type SelectValue = string | number | null

type SelectOption = {
  value: SelectValue
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: SelectValue
    options: SelectOption[]
    ariaLabel?: string
    placeholder?: string
  }>(),
  {
    ariaLabel: 'Select option',
    placeholder: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue]
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find((option) => option.value === props.modelValue)
  return selected?.label ?? props.placeholder
})

function selectOption(option: SelectOption) {
  if (option.disabled) {
    return
  }

  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleWindowKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleWindowKeydown)
  }
})
</script>

<template>
  <div class="fd-unified-select-shell">
    <button
      type="button"
      class="fd-unified-select-trigger"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="isOpen = !isOpen"
    >
      <span class="truncate">{{ selectedLabel }}</span>
    </button>

    <button
      v-if="isOpen"
      type="button"
      class="fd-unified-select-backdrop"
      aria-label="关闭下拉菜单"
      @click="isOpen = false"
    />

    <div v-if="isOpen" class="fd-unified-select-menu">
      <button
        v-for="option in options"
        :key="`${option.value}`"
        type="button"
        class="fd-unified-select-option"
        :class="[
          option.value === modelValue ? 'fd-unified-select-option-active' : '',
          option.disabled ? 'fd-unified-select-option-disabled' : ''
        ]"
        :disabled="option.disabled"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
