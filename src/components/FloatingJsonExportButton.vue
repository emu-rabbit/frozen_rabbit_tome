<script setup lang="ts">
defineProps<{
  label: string;
  busyLabel?: string;
  exportedLabel: string;
  disabled?: boolean;
  busy?: boolean;
  exported?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <Teleport to="body">
    <button
      type="button"
      class="floating-json-export-button"
      :class="{ 'is-exported': exported }"
      :aria-label="busy ? busyLabel || label : exported ? exportedLabel : label"
      :title="busy ? busyLabel || label : exported ? exportedLabel : label"
      :disabled="disabled || busy || exported"
      @click="emit('click')"
    >
      <i :class="busy ? 'pi pi-spin pi-spinner' : exported ? 'pi pi-check' : 'pi pi-download'" aria-hidden="true"></i>
    </button>
  </Teleport>
</template>

<style scoped>
.floating-json-export-button {
  position: fixed;
  right: max(1.35rem, calc(env(safe-area-inset-right) + 0.9rem));
  bottom: max(1.35rem, calc(env(safe-area-inset-bottom) + 0.9rem));
  z-index: 45;
  width: 4rem;
  height: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(82 168 144 / 0.38);
  border-radius: 999px;
  background: #52a890;
  color: white;
  box-shadow: 0 16px 34px rgb(15 23 42 / 0.21);
  font-size: 1.38rem;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;
}

.floating-json-export-button:hover:not(:disabled),
.floating-json-export-button:focus-visible {
  border-color: rgb(82 168 144 / 0.7);
  background: #3f8f79;
  box-shadow: 0 20px 40px rgb(15 23 42 / 0.25);
  transform: translateY(-2px);
  outline: none;
}

.floating-json-export-button:focus-visible {
  box-shadow:
    0 20px 40px rgb(15 23 42 / 0.25),
    0 0 0 4px rgb(82 168 144 / 0.22);
}

.floating-json-export-button:disabled {
  cursor: default;
  opacity: 0.78;
}

.floating-json-export-button.is-exported {
  border-color: rgb(34 197 94 / 0.5);
  background: #16a34a;
}

:global(html.dark) .floating-json-export-button {
  border-color: rgb(94 234 212 / 0.28);
  background: #047857;
  box-shadow: 0 18px 38px rgb(0 0 0 / 0.35);
}

:global(html.dark) .floating-json-export-button:hover:not(:disabled),
:global(html.dark) .floating-json-export-button:focus-visible {
  border-color: rgb(94 234 212 / 0.52);
  background: #059669;
}

@media (max-width: 640px) {
  .floating-json-export-button {
    right: max(1.15rem, calc(env(safe-area-inset-right) + 0.75rem));
    bottom: max(1.15rem, calc(env(safe-area-inset-bottom) + 0.75rem));
    width: 3.6rem;
    height: 3.6rem;
    font-size: 1.2rem;
  }
}
</style>
