<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  modelValue: boolean;
  kicker: string;
  title: string;
  description: string;
  continueLabel: string;
  cancelLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  continue: [];
}>();

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  emit('continue');
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="json-import-warning">
      <div v-if="modelValue" class="json-import-warning-dialog" role="dialog" aria-modal="true">
        <button type="button" class="json-import-warning-backdrop" :aria-label="cancelLabel" @click="close"></button>
        <section class="json-import-warning-panel">
          <div class="json-import-warning-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="json-import-warning-content">
            <p>{{ kicker }}</p>
            <h3>{{ title }}</h3>
            <span>{{ description }}</span>
          </div>
          <div class="json-import-warning-actions">
            <Button icon="pi pi-arrow-right" :label="continueLabel" class="p-button-sm p-button-primary json-import-warning-action" @click="confirm" />
            <Button icon="pi pi-times" :label="cancelLabel" class="p-button-sm p-button-text json-import-warning-action" @click="close" />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.json-import-warning-dialog {
  position: fixed;
  inset: 0;
  z-index: 72;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.json-import-warning-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.46);
  backdrop-filter: blur(5px);
}

.json-import-warning-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 31rem);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border-radius: 18px;
  border: 1px solid #fde68a;
  background: white;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
}

:global(html.dark .json-import-warning-panel) {
  border-color: rgb(146 64 14 / 0.72);
  background: #0f172a;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.5);
}

.json-import-warning-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #fef3c7;
  color: #b45309;
  font-size: 1.15rem;
}

:global(html.dark .json-import-warning-icon) {
  background: rgb(120 53 15 / 0.34);
  color: #fbbf24;
}

.json-import-warning-content {
  display: grid;
  gap: 0.45rem;
}

.json-import-warning-content p,
.json-import-warning-content h3,
.json-import-warning-content span {
  margin: 0;
}

.json-import-warning-content p {
  color: #d97706;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.2;
}

.json-import-warning-content h3 {
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1.25;
}

.json-import-warning-content span {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.6;
}

:global(html.dark .json-import-warning-content h3) {
  color: #f8fafc;
}

:global(html.dark .json-import-warning-content span) {
  color: #cbd5e1;
}

.json-import-warning-actions {
  display: grid;
  gap: 0.55rem;
}

:deep(.json-import-warning-action) {
  width: 100%;
  justify-content: center;
  border-radius: 0.8rem;
  min-height: 2.5rem;
  font-weight: 800;
}

.json-import-warning-enter-active,
.json-import-warning-leave-active {
  transition: opacity 0.16s ease;
}

.json-import-warning-enter-active .json-import-warning-panel,
.json-import-warning-leave-active .json-import-warning-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.json-import-warning-enter-from,
.json-import-warning-leave-to {
  opacity: 0;
}

.json-import-warning-enter-from .json-import-warning-panel,
.json-import-warning-leave-to .json-import-warning-panel {
  opacity: 0;
  transform: translateY(0.4rem) scale(0.98);
}

@media (min-width: 560px) {
  .json-import-warning-actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
