<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  modelValue: boolean;
  title: string;
  description: string;
  closeLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function close() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="json-import-error">
      <div v-if="modelValue" class="json-import-error-dialog" role="alertdialog" aria-modal="true">
        <button type="button" class="json-import-error-backdrop" :aria-label="closeLabel" @click="close"></button>
        <section class="json-import-error-panel">
          <div class="json-import-error-icon">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="json-import-error-content">
            <h3>{{ title }}</h3>
            <p>{{ description }}</p>
          </div>
          <Button icon="pi pi-check" :label="closeLabel" class="p-button-sm p-button-primary json-import-error-action" @click="close" />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.json-import-error-dialog {
  position: fixed;
  inset: 0;
  z-index: 72;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.json-import-error-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.46);
  backdrop-filter: blur(5px);
}

.json-import-error-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 29rem);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border-radius: 18px;
  border: 1px solid #fecaca;
  background: white;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
}

:global(html.dark .json-import-error-panel) {
  border-color: rgb(127 29 29 / 0.72);
  background: #0f172a;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.5);
}

.json-import-error-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 1.15rem;
}

:global(html.dark .json-import-error-icon) {
  background: rgb(127 29 29 / 0.34);
  color: #fca5a5;
}

.json-import-error-content {
  display: grid;
  gap: 0.45rem;
}

.json-import-error-content h3,
.json-import-error-content p {
  margin: 0;
}

.json-import-error-content h3 {
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1.25;
}

.json-import-error-content p {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.6;
}

:global(html.dark .json-import-error-content h3) {
  color: #f8fafc;
}

:global(html.dark .json-import-error-content p) {
  color: #cbd5e1;
}

:deep(.json-import-error-action) {
  width: 100%;
  justify-content: center;
  border-radius: 0.8rem;
  min-height: 2.5rem;
  font-weight: 800;
}

.json-import-error-enter-active,
.json-import-error-leave-active {
  transition: opacity 0.16s ease;
}

.json-import-error-enter-active .json-import-error-panel,
.json-import-error-leave-active .json-import-error-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.json-import-error-enter-from,
.json-import-error-leave-to {
  opacity: 0;
}

.json-import-error-enter-from .json-import-error-panel,
.json-import-error-leave-to .json-import-error-panel {
  opacity: 0;
  transform: translateY(0.4rem) scale(0.98);
}
</style>
