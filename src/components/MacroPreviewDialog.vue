<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { MacroBuildResult, MacroPart } from '../utils/macroGenerator';
import { copyTextToClipboard } from '../utils/clipboard';
import { trackMacroCopied } from '../services/analytics';

const props = defineProps<{
  modelValue: boolean;
  macro: MacroBuildResult | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const copiedPartId = ref<string | null>(null);
const failedPartId = ref<string | null>(null);
let feedbackTimer: ReturnType<typeof window.setTimeout> | null = null;

function getPartId(partIndex: number, groupKey?: string) {
  return groupKey ? `${groupKey}-${partIndex}` : `${partIndex}`;
}

const parts = computed(() => props.macro?.parts ?? []);
const groups = computed(() => props.macro?.groups ?? []);
const hasGroups = computed(() => groups.value.length > 1);
const totalLines = computed(() => props.macro?.fullLines.length ?? 0);
const isSplit = computed(() => parts.value.length > 1);

function closeDialog() {
  emit('update:modelValue', false);
}

async function copyPart(part: MacroPart, groupKey?: string) {
  const id = getPartId(part.index, groupKey);
  const copied = await copyTextToClipboard(part.text);
  copiedPartId.value = copied ? id : null;
  failedPartId.value = copied ? null : id;
  const group = groupKey ? groups.value.find((entry) => entry.key === groupKey) : null;
  trackMacroCopied({
    success: copied,
    lineCount: part.lines.length,
    partIndex: part.index,
    partCount: group?.macro.parts.length ?? parts.value.length,
    hasGroups: hasGroups.value,
    groupKey
  });
  resetFeedbackLater();
}

function copyLabel(part: MacroPart, groupKey?: string) {
  const id = getPartId(part.index, groupKey);
  if (copiedPartId.value === id) return t('macro.preview.copyStates.copied');
  if (failedPartId.value === id) return t('macro.preview.copyStates.failed');

  return isSplit.value || hasGroups.value
    ? t('macro.preview.copyPart', { index: part.index })
    : t('macro.preview.copySingle');
}

function copyIcon(part: MacroPart, groupKey?: string) {
  const id = getPartId(part.index, groupKey);
  if (failedPartId.value === id) return 'pi pi-exclamation-triangle';
  if (copiedPartId.value === id) return 'pi pi-check';

  return 'pi pi-copy';
}

function resetFeedbackLater() {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
  }

  feedbackTimer = window.setTimeout(() => {
    copiedPartId.value = null;
    failedPartId.value = null;
    feedbackTimer = null;
  }, 1800);
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) return;

  copiedPartId.value = null;
  failedPartId.value = null;
});

onBeforeUnmount(() => {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="macro-dialog">
      <div
        v-if="modelValue && macro"
        class="macro-dialog-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('macro.preview.title')"
        @keydown.esc="closeDialog"
      >
        <button class="macro-dialog-backdrop" type="button" :aria-label="t('macro.preview.close')" @click="closeDialog"></button>

        <section class="macro-dialog-panel">
          <header class="macro-dialog-header">
            <div class="macro-dialog-title-group">
              <span class="macro-dialog-kicker">{{ t('macro.preview.kicker') }}</span>
              <h2>{{ t('macro.preview.title') }}</h2>
            </div>
            <button class="macro-dialog-close" type="button" :aria-label="t('macro.preview.close')" @click="closeDialog">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="macro-dialog-summary" :class="{ 'is-split': isSplit || hasGroups }">
            <i class="pi" :class="isSplit || hasGroups ? 'pi-clone' : 'pi-file'"></i>
            <span>
              {{ hasGroups
                ? t('macro.preview.groupSummary', { count: groups.length, lines: totalLines })
                : isSplit
                ? t('macro.preview.splitSummary', { count: parts.length, lines: totalLines })
                : t('macro.preview.singleSummary', { lines: totalLines }) }}
            </span>
          </div>

          <div v-if="hasGroups" class="macro-group-list">
            <section v-for="group in groups" :key="group.key" class="macro-group">
              <h3 class="macro-group-title">{{ group.title }}</h3>
              <div class="macro-part-list" :class="{ 'is-split': group.macro.parts.length > 1 }">
                <article v-for="part in group.macro.parts" :key="`${group.key}-${part.index}`" class="macro-part">
                  <div class="macro-part-header">
                    <div>
                      <h4>{{ group.macro.parts.length > 1 ? t('macro.preview.partTitle', { index: part.index }) : t('macro.preview.singleTitle') }}</h4>
                      <p>{{ t('macro.preview.lineCount', { count: part.lines.length }) }}</p>
                    </div>
                    <Button
                      :icon="copyIcon(part, group.key)"
                      :label="copyLabel(part, group.key)"
                      class="p-button-sm macro-copy-button"
                      :class="{ 'is-copied': copiedPartId === getPartId(part.index, group.key), 'is-failed': failedPartId === getPartId(part.index, group.key) }"
                      @click="copyPart(part, group.key)"
                    />
                  </div>

                  <pre class="macro-code"><code><span v-for="(line, lineIndex) in part.lines" :key="`${group.key}-${part.index}-${lineIndex}`">{{ line }}{{ lineIndex < part.lines.length - 1 ? '\n' : '' }}</span></code></pre>
                </article>
              </div>
            </section>
          </div>

          <div v-else class="macro-part-list" :class="{ 'is-split': isSplit }">
            <article v-for="part in parts" :key="part.index" class="macro-part">
              <div class="macro-part-header">
                <div>
                  <h3>{{ isSplit ? t('macro.preview.partTitle', { index: part.index }) : t('macro.preview.singleTitle') }}</h3>
                  <p>{{ t('macro.preview.lineCount', { count: part.lines.length }) }}</p>
                </div>
                <Button
                  :icon="copyIcon(part)"
                  :label="copyLabel(part)"
                  class="p-button-sm macro-copy-button"
                  :class="{ 'is-copied': copiedPartId === getPartId(part.index), 'is-failed': failedPartId === getPartId(part.index) }"
                  @click="copyPart(part)"
                />
              </div>

              <pre class="macro-code"><code><span v-for="(line, lineIndex) in part.lines" :key="`${part.index}-${lineIndex}`">{{ line }}{{ lineIndex < part.lines.length - 1 ? '\n' : '' }}</span></code></pre>
            </article>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.macro-dialog-root {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.macro-dialog-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.56);
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.macro-dialog-panel {
  position: relative;
  width: min(100%, 58rem);
  max-height: calc(100dvh - 1.5rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  border: 1px solid rgb(209 250 229 / 0.86);
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.24);
}

:global(html.dark .macro-dialog-panel) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
  box-shadow: 0 24px 72px rgb(0 0 0 / 0.46);
}

.macro-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.macro-dialog-title-group {
  min-width: 0;
}

.macro-dialog-kicker {
  display: inline-flex;
  align-items: center;
  color: #52a890;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0;
}

.macro-dialog-title-group h2 {
  margin: 0.25rem 0 0;
  color: #1e293b;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.2;
}

:global(html.dark .macro-dialog-title-group h2) {
  color: #f8fafc;
}

.macro-dialog-close {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #64748b;
  transition: all 0.18s ease;
}

.macro-dialog-close:hover {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #15803d;
}

:global(html.dark .macro-dialog-close) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.78);
  color: #cbd5e1;
}

:global(html.dark .macro-dialog-close:hover) {
  border-color: rgb(82 168 144 / 0.6);
  background: rgb(20 83 45 / 0.24);
  color: #bbf7d0;
}

.macro-dialog-summary {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 1.25rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #d1fae5;
  border-radius: 0.9rem;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.86rem;
  font-weight: 800;
  line-height: 1.4;
}

.macro-dialog-summary.is-split {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

:global(html.dark .macro-dialog-summary) {
  border-color: rgb(21 128 61 / 0.48);
  background: rgb(20 83 45 / 0.18);
  color: #bbf7d0;
}

:global(html.dark .macro-dialog-summary.is-split) {
  border-color: rgb(180 83 9 / 0.52);
  background: rgb(120 53 15 / 0.22);
  color: #fde68a;
}

.macro-part-list {
  display: grid;
  gap: 0.9rem;
  overflow-y: auto;
  padding: 0 1.25rem 1.25rem;
}

.macro-group-list {
  display: grid;
  gap: 1rem;
  overflow-y: auto;
  padding: 0 1.25rem 1.25rem;
}

.macro-group {
  display: grid;
  gap: 0.65rem;
}

.macro-group .macro-part-list {
  overflow-y: visible;
  padding: 0;
}

.macro-group-title {
  margin: 0;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 900;
}

:global(html.dark .macro-group-title) {
  color: #e2e8f0;
}

@media (min-width: 860px) {
  .macro-part-list.is-split {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

.macro-part {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
}

:global(html.dark .macro-part) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.36);
}

.macro-part-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  padding: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  background: rgb(255 255 255 / 0.78);
}

@media (min-width: 520px) {
  .macro-part-header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
}

:global(html.dark .macro-part-header) {
  border-color: #1e293b;
  background: rgb(15 23 42 / 0.72);
}

.macro-part-header h3 {
  margin: 0;
  color: #334155;
  font-size: 0.96rem;
  font-weight: 900;
}

.macro-part-header h4 {
  margin: 0;
  color: #334155;
  font-size: 0.92rem;
  font-weight: 900;
}

.macro-part-header p {
  margin: 0.2rem 0 0;
  color: #94a3b8;
  font-size: 0.76rem;
  font-weight: 800;
}

:global(html.dark .macro-part-header h3) {
  color: #e2e8f0;
}

:global(html.dark .macro-part-header h4) {
  color: #e2e8f0;
}

.macro-copy-button {
  width: 100%;
  justify-content: center;
}

@media (min-width: 520px) {
  .macro-copy-button {
    width: auto;
  }
}

:deep(.macro-copy-button.is-copied) {
  border-color: rgb(134 239 172);
  background: rgb(220 252 231 / 0.84);
  color: #15803d;
}

:global(html.dark .macro-copy-button.is-copied) {
  border-color: rgb(21 128 61 / 0.55);
  background: rgb(20 83 45 / 0.24);
  color: #bbf7d0;
}

:deep(.macro-copy-button.is-failed) {
  border-color: rgb(252 165 165);
  background: rgb(254 226 226 / 0.86);
  color: #b91c1c;
}

:global(html.dark .macro-copy-button.is-failed) {
  border-color: rgb(153 27 27 / 0.62);
  background: rgb(127 29 29 / 0.25);
  color: #fecaca;
}

.macro-code {
  min-height: 15.6rem;
  max-height: 24rem;
  margin: 0;
  padding: 0.95rem;
  overflow: auto;
  color: #0f172a;
  background: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  white-space: pre;
}

:global(html.dark .macro-code) {
  color: #e2e8f0;
  background: #020617;
}

.macro-dialog-enter-active,
.macro-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.macro-dialog-enter-active .macro-dialog-panel,
.macro-dialog-leave-active .macro-dialog-panel {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.macro-dialog-enter-from,
.macro-dialog-leave-to {
  opacity: 0;
}

.macro-dialog-enter-from .macro-dialog-panel,
.macro-dialog-leave-to .macro-dialog-panel {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}
</style>
