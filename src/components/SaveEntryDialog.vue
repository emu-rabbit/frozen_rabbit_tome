<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  description: string;
  nameLabel: string;
  defaultName: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [name: string];
}>();

const draftName = ref('');
const nameInput = ref<{ $el?: HTMLElement } | null>(null);

watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) return;

  draftName.value = props.defaultName;
  await nextTick();
  const input = nameInput.value?.$el?.querySelector('input') as HTMLInputElement | null;
  input?.focus();
  input?.select();
});

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const name = draftName.value.trim() || props.defaultName;
  emit('confirm', name);
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="save-entry">
      <div v-if="modelValue" class="save-entry-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <button type="button" class="save-entry-backdrop" :aria-label="cancelLabel" @click="close"></button>
        <section class="save-entry-panel">
          <header class="save-entry-header">
            <div>
              <h3>{{ title }}</h3>
              <p>{{ description }}</p>
            </div>
            <button type="button" class="save-entry-close" :aria-label="cancelLabel" @click="close">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <label class="save-entry-field">
            <span>{{ nameLabel }}</span>
            <InputText
              ref="nameInput"
              v-model="draftName"
              class="save-entry-input"
              autocomplete="off"
              @keydown.enter.prevent="confirm"
            />
          </label>

          <div class="save-entry-preview">
            <slot></slot>
          </div>

          <footer class="save-entry-actions">
            <Button class="p-button-text save-entry-action save-entry-cancel" :label="cancelLabel" @click="close" />
            <Button class="p-button-primary save-entry-action save-entry-confirm" icon="pi pi-check" :label="confirmLabel" @click="confirm" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.save-entry-dialog {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.save-entry-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.42);
  backdrop-filter: blur(6px);
}

.save-entry-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 44rem);
  max-height: min(calc(100dvh - 1.5rem), 46rem);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 1rem;
  overflow: hidden;
  padding: 0.95rem;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: white;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
}

:global(html.dark .save-entry-panel) {
  border-color: #334155;
  background: #0f172a;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.5);
}

.save-entry-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.save-entry-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1.25;
}

:global(html.dark .save-entry-header h3) {
  color: #f8fafc;
}

.save-entry-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.55;
}

:global(html.dark .save-entry-header p) {
  color: #cbd5e1;
}

.save-entry-close {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
}

:global(html.dark .save-entry-close) {
  background: rgb(30 41 59 / 0.72);
  color: #cbd5e1;
}

.save-entry-field {
  display: grid;
  gap: 0.45rem;
}

.save-entry-field span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 900;
}

:global(html.dark .save-entry-field span) {
  color: #cbd5e1;
}

:deep(.save-entry-input) {
  width: 100% !important;
  border-radius: 0.85rem !important;
  border: 1.5px solid #dbe3ee !important;
  padding: 0.8rem 0.95rem !important;
  color: #0f172a !important;
  font-weight: 800 !important;
}

:global(html.dark .save-entry-input) {
  border-color: #334155 !important;
  background: #1e293b !important;
  color: #f8fafc !important;
}

:deep(.save-entry-input:focus) {
  border-color: #52a890 !important;
  box-shadow: 0 0 0 4px rgba(82, 168, 144, 0.15) !important;
}

.save-entry-preview {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding-right: 0.15rem;
  overscroll-behavior: contain;
}

.save-entry-actions {
  display: grid;
  gap: 0.55rem;
  padding-top: 0.15rem;
}

.save-entry-confirm {
  order: -1;
}

:deep(.save-entry-action) {
  width: 100%;
  justify-content: center;
  border-radius: 0.8rem;
  min-height: 2.45rem;
  font-weight: 900;
}

.save-entry-enter-active,
.save-entry-leave-active {
  transition: opacity 0.16s ease;
}

.save-entry-enter-active .save-entry-panel,
.save-entry-leave-active .save-entry-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.save-entry-enter-from,
.save-entry-leave-to {
  opacity: 0;
}

.save-entry-enter-from .save-entry-panel,
.save-entry-leave-to .save-entry-panel {
  opacity: 0;
  transform: translateY(0.4rem) scale(0.98);
}

@media (min-width: 560px) {
  .save-entry-dialog {
    padding: 1rem;
  }

  .save-entry-panel {
    padding: 1.15rem;
    max-height: min(90dvh, 46rem);
  }

  .save-entry-actions {
    grid-template-columns: 1fr 1fr;
  }

  .save-entry-confirm {
    order: 0;
  }
}
</style>
