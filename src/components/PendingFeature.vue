<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';

defineProps<{
  title: string;
  type: 'collectable' | 'crystal';
  backPath: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="pending-feature">
    <div class="pending-content">
      <div class="pending-icon-wrap" :class="type">
        <i v-if="type === 'collectable'" class="pi pi-hammer"></i>
        <i v-else class="pi pi-sparkles"></i>
      </div>
      
      <div class="pending-text">
        <h2 class="item-title">{{ title }}</h2>
        <div class="status-badge" :class="type">
          {{ type === 'collectable' ? t('createGuide.collectableSystem') : t('createGuide.crystalGatheringSystem') }}
        </div>
        <p class="description">
          {{ type === 'collectable' ? t('common.pending.collectableDesc') : t('common.pending.crystalDesc') }}
        </p>
      </div>

      <div class="pending-actions">
        <router-link :to="backPath">
          <Button 
            :label="t('common.backToSelection')" 
            icon="pi pi-arrow-left" 
            class="back-btn rounded-2xl px-10" 
          />
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.pending-content {
  max-width: 480px;
  width: 100%;
}

.pending-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.pending-icon-wrap.collectable {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #a855f7;
}

:global(.dark .pending-icon-wrap.collectable) {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
  color: #c084fc;
}

.pending-icon-wrap.crystal {
  background: linear-gradient(135deg, #ecfeff, #cffafe);
  color: #06b6d4;
}

:global(.dark .pending-icon-wrap.crystal) {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05));
  color: #22d3ee;
}

.item-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 0.75rem;
  line-height: 1.2;
}

:global(.dark .item-title) {
  color: #f1f5f9;
}

.status-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}

.status-badge.collectable {
  background: #f3e8ff;
  color: #7e22ce;
}

:global(.dark .status-badge.collectable) {
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
}

.status-badge.crystal {
  background: #ecfeff;
  color: #0e7490;
}

:global(.dark .status-badge.crystal) {
  background: rgba(6, 182, 212, 0.2);
  color: #67e8f9;
}

.description {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 2.5rem;
}

:global(.dark .description) {
  color: #94a3b8;
}

.pending-actions {
  display: flex;
  justify-content: center;
}

:deep(.back-btn) {
  background: #52a890 !important;
  border: none !important;
  color: white !important;
  font-weight: 800 !important;
  height: 3.5rem !important;
  box-shadow: 0 10px 15px -3px rgba(82, 168, 144, 0.3) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

:deep(.back-btn:hover) {
  transform: translateY(-2px);
  background: #3d8b75 !important;
  box-shadow: 0 15px 20px -5px rgba(82, 168, 144, 0.4) !important;
}

:deep(.back-btn:active) {
  transform: translateY(1px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
