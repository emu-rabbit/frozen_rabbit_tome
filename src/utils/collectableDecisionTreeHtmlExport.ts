import type {
  CollectableActionKind,
  CollectablePolicyBranch,
  CollectablePolicyNode,
  CollectableStateSummary
} from '../types/collectable';
import type { GatherableItem } from '../types/game';
import {
  buildCollectableGuidedQuestions,
  collectableBranchRouteKey,
  hasBranchLabel,
  type CollectableGuidedQuestion,
  type CollectableGuidedQuestionLabels,
  type CollectableGuidedSelections
} from './collectablePolicyInteraction';

export interface CollectableDecisionTreeActionExport {
  kind: CollectableActionKind;
  name: string;
  iconUrl: string;
  gpCost: number;
}

export interface CollectableDecisionTreeBranchExport {
  labelKeys: string[];
  labels: string[];
  condition: string;
  probability: number;
  routeKey: string;
  criteria: CollectableGuidedSelections;
  outcome: {
    gp: number;
    integrity: number;
    collectability: number;
    score: number;
    summary: string;
  };
  nextId: string | null;
}

export interface CollectableDecisionTreeNodeExport {
  id: string;
  state: CollectableStateSummary;
  stateSummary: string;
  recommendedAction: CollectableDecisionTreeActionExport;
  expectedScore: number;
  guidedQuestions: CollectableGuidedQuestion[];
  confluentBranchIndex: number | null;
  branches: CollectableDecisionTreeBranchExport[];
}

export interface CollectableDecisionTreeSnapshot {
  rootNodeId: string;
  nodes: Record<string, CollectableDecisionTreeNodeExport>;
  nodeOrder: string[];
}

export interface CollectableDecisionTreeSnapshotOptions {
  actionName: (kind: CollectableActionKind) => string;
  actionIcon: (kind: CollectableActionKind) => string;
  branchLabel: (labelKey: string) => string;
  conditionLabel: (conditionKey: string) => string;
  formatStateSummary: (state: Pick<CollectableStateSummary, 'gp' | 'integrity' | 'collectability'>) => string;
  guidedQuestionLabels: CollectableGuidedQuestionLabels;
}

export interface CollectableDecisionTreeHtmlMetric {
  label: string;
  value: string;
  detail?: string;
  primary?: boolean;
}

export interface CollectableDecisionTreeHtmlRow {
  label: string;
  value: string;
}

export interface CollectableDecisionTreeHtmlSection {
  title: string;
  rows: CollectableDecisionTreeHtmlRow[];
}

export interface CollectableDecisionTreeHtmlTexts {
  documentTitle: string;
  appTitle: string;
  appSubtitle: string;
  inputTitle: string;
  resultTitle: string;
  modelVersionsTitle: string;
  howToReadTitle: string;
  howToReadDescription: string;
  generatedAt: string;
  policy: {
    now: string;
    confirmOutcome: string;
    nextBranches: string;
    confirmHint: string;
    confluentHint: string;
    deterministicHint: string;
    collectQuestion: string;
    standardQuestion: string;
    wiseQuestion: string;
    revisitQuestion: string;
    collectabilityQuestion: string;
    integrityQuestion: string;
    integrityOption: string;
    collectOptions: {
      success: string;
      failed: string;
    };
    standardOptions: {
      proc: string;
      noProc: string;
    };
    wiseOptions: {
      proc: string;
      noProc: string;
    };
    revisitOptions: {
      proc: string;
      noProc: string;
    };
    matchedOutcome: string;
    confluentOutcome: string;
    deterministicOutcome: string;
    sameOutcome: string;
    readyOutcome: string;
    waitingSelection: string;
    noMatchedOutcome: string;
    continue: string;
    outcomeValue: string;
    nextAction: string;
    terminal: string;
    back: string;
    root: string;
  };
}

export interface CollectableDecisionTreeHtmlDocument {
  locale: string;
  generatedAt: string;
  theme: 'light' | 'dark';
  item: Pick<GatherableItem, 'itemId' | 'nameLocale' | 'nameEn' | 'iconUrl'>;
  texts: CollectableDecisionTreeHtmlTexts;
  inputSections: CollectableDecisionTreeHtmlSection[];
  resultMetrics: CollectableDecisionTreeHtmlMetric[];
  modelVersionRows: CollectableDecisionTreeHtmlRow[];
  policy: CollectableDecisionTreeSnapshot;
}

export function buildCollectableDecisionTreeSnapshot(
  root: CollectablePolicyNode,
  options: CollectableDecisionTreeSnapshotOptions
): CollectableDecisionTreeSnapshot {
  const nodes: Record<string, CollectableDecisionTreeNodeExport> = {};
  const nodeOrder: string[] = [];

  function visit(node: CollectablePolicyNode) {
    if (nodes[node.id]) return;

    nodeOrder.push(node.id);
    const guidedQuestions = buildCollectableGuidedQuestions(node.branches, options.guidedQuestionLabels);
    const serializedBranches = node.branches.map((branch) => serializeBranch(branch, guidedQuestions, options));
    nodes[node.id] = {
      id: node.id,
      state: node.state,
      stateSummary: options.formatStateSummary(node.state),
      recommendedAction: {
        kind: node.recommendedAction.kind,
        name: options.actionName(node.recommendedAction.kind),
        iconUrl: options.actionIcon(node.recommendedAction.kind),
        gpCost: node.recommendedAction.gpCost
      },
      expectedScore: node.expectedScore,
      guidedQuestions,
      confluentBranchIndex: guidedQuestions.length ? null : findConfluentBranchIndex(serializedBranches),
      branches: serializedBranches
    };

    for (const branch of node.branches) {
      if (branch.next) visit(branch.next);
    }
  }

  visit(root);

  return {
    rootNodeId: root.id,
    nodes,
    nodeOrder
  };
}

export function buildCollectableDecisionTreeHtml(document: CollectableDecisionTreeHtmlDocument) {
  const data = {
    policy: document.policy,
    texts: document.texts.policy
  };

  return `<!doctype html>
<html lang="${escapeAttribute(document.locale)}" class="export-theme-${document.theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(document.texts.documentTitle)}</title>
  <link rel="stylesheet" href="https://unpkg.com/primeicons@7.0.0/primeicons.css">
  <style>
${standaloneCss()}
  </style>
</head>
<body>
  <main class="export-page">
    <header class="export-header">
      <div class="export-item-icon">
        ${document.item.iconUrl ? `<img src="${escapeAttribute(document.item.iconUrl)}" alt="">` : '<i class="pi pi-box"></i>'}
      </div>
      <div class="export-heading">
        <span>${escapeHtml(document.texts.appSubtitle)}</span>
        <h1>${escapeHtml(document.texts.documentTitle)}</h1>
        <p>${escapeHtml(document.texts.appTitle)} · ${escapeHtml(document.texts.generatedAt)} ${escapeHtml(formatGeneratedAt(document.generatedAt))}</p>
      </div>
    </header>

    <section class="export-info-grid" aria-label="${escapeAttribute(document.texts.inputTitle)}">
      ${document.inputSections.map(renderSection).join('\n')}
    </section>

    ${document.resultMetrics.length ? `<section class="export-result-section">
      <div class="export-section-heading">
        <span>${escapeHtml(document.texts.resultTitle)}</span>
        <p>${escapeHtml(document.texts.howToReadDescription)}</p>
      </div>
      <div class="score-metric-grid export-metrics">
        ${document.resultMetrics.map(renderMetric).join('\n')}
      </div>
    </section>` : ''}

    ${document.modelVersionRows.length ? `<section class="export-model-section">
      <div class="export-section-heading">
        <span>${escapeHtml(document.texts.modelVersionsTitle)}</span>
      </div>
      <div class="export-model-grid">
        ${document.modelVersionRows.map(renderRow).join('\n')}
      </div>
    </section>` : ''}

    <section id="decision-tree-root" class="collectable-policy" aria-live="polite"></section>
  </main>
  <script id="decision-tree-data" type="application/json">${escapeScriptJson(JSON.stringify(data))}</script>
  <script>
${standaloneScript()}
  </script>
</body>
</html>
`;
}

export function downloadHtmlFile(html: string, fileName: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = sanitizeHtmlFileName(fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildHtmlExportFileName(payload: {
  item: Pick<GatherableItem, 'itemId' | 'nameLocale' | 'nameEn'>;
  scenarioLabel: string;
  generatedAt?: Date;
}) {
  const itemName = payload.item.nameLocale || payload.item.nameEn || `item-${payload.item.itemId}`;
  const date = (payload.generatedAt ?? new Date()).toISOString().slice(0, 10);
  return sanitizeHtmlFileName(`${itemName} - ${payload.scenarioLabel} - ${date}.html`);
}

export function sanitizeHtmlFileName(fileName: string) {
  return fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .slice(0, 160);
}

function serializeBranch(
  branch: CollectablePolicyBranch,
  guidedQuestions: CollectableGuidedQuestion[],
  options: CollectableDecisionTreeSnapshotOptions
): CollectableDecisionTreeBranchExport {
  const labelKeys = branch.labelKeys?.length ? branch.labelKeys : [branch.labelKey];

  return {
    labelKeys,
    labels: labelKeys.map(options.branchLabel),
    condition: options.conditionLabel(branch.conditionKey),
    probability: branch.probability,
    routeKey: collectableBranchRouteKey(branch),
    criteria: buildBranchCriteria(branch, guidedQuestions),
    outcome: {
      gp: branch.outcome.gp,
      integrity: branch.outcome.integrity,
      collectability: branch.outcome.collectability,
      score: branch.outcome.score,
      summary: options.formatStateSummary(branch.outcome)
    },
    nextId: branch.next?.id ?? null
  };
}

function buildBranchCriteria(
  branch: CollectablePolicyBranch,
  guidedQuestions: CollectableGuidedQuestion[]
): CollectableGuidedSelections {
  const criteria: CollectableGuidedSelections = {};
  for (const question of guidedQuestions) {
    if (question.kind === 'collectSuccess') {
      criteria.collectSuccess = hasBranchLabel(branch, 'collectableSolver.branches.collectSuccess');
    } else if (question.kind === 'standard') {
      criteria.standard = hasBranchLabel(branch, 'collectableSolver.branches.standardProc');
    } else if (question.kind === 'wise') {
      criteria.wise = hasBranchLabel(branch, 'collectableSolver.branches.wiseProc');
    } else if (question.kind === 'revisit') {
      criteria.revisit = hasBranchLabel(branch, 'collectableSolver.branches.revisitProc');
    } else if (question.kind === 'collectability') {
      criteria.collectability = branch.outcome.collectability;
    } else if (question.kind === 'integrity') {
      criteria.integrity = branch.outcome.integrity;
    }
  }
  return criteria;
}

function findConfluentBranchIndex(branches: CollectableDecisionTreeBranchExport[]) {
  if (branches.length === 0) return null;
  const routeKeys = new Set(branches.map((branch) => branch.routeKey));
  return routeKeys.size === 1 ? 0 : null;
}

function renderSection(section: CollectableDecisionTreeHtmlSection) {
  return `<article class="export-info-card">
    <h2>${escapeHtml(section.title)}</h2>
    <dl>
      ${section.rows.map((row) => `<div class="export-info-row"><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join('\n')}
    </dl>
  </article>`;
}

function renderMetric(metric: CollectableDecisionTreeHtmlMetric) {
  return `<div class="score-metric-card${metric.primary ? ' is-primary-metric' : ''}">
    <span>${escapeHtml(metric.label)}</span>
    <strong>${escapeHtml(metric.value)}</strong>
    ${metric.detail ? `<small>${escapeHtml(metric.detail)}</small>` : ''}
  </div>`;
}

function renderRow(row: CollectableDecisionTreeHtmlRow) {
  return `<div class="export-model-row">
    <span>${escapeHtml(row.label)}</span>
    <strong>${escapeHtml(row.value)}</strong>
  </div>`;
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: unknown) {
  return escapeHtml(value);
}

function escapeScriptJson(value: string) {
  return value
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function standaloneCss() {
  return `
:root {
  color-scheme: light dark;
  --fr-bg: #f8fafc;
  --fr-card: #ffffff;
  --fr-muted-card: #f0fdf4;
  --fr-border: #d1fae5;
  --fr-soft-border: #e2e8f0;
  --fr-text: #0f172a;
  --fr-muted: #64748b;
  --fr-accent: #52a890;
  --fr-accent-dark: #0f766e;
}

html.export-theme-light {
  color-scheme: light;
}

html.export-theme-dark {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: linear-gradient(180deg, #f0fdf4 0, #f8fafc 22rem, #f8fafc 100%);
  color: var(--fr-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button {
  font: inherit;
}

.export-page {
  width: min(100%, 72rem);
  display: grid;
  gap: 0.85rem;
  margin: 0 auto;
  padding: 1rem;
}

.export-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--fr-soft-border);
  border-radius: 0.85rem;
  background: rgb(255 255 255 / 0.92);
  padding: 0.8rem 0.9rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.05);
}

.export-item-icon {
  width: 3.35rem;
  height: 3.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.85rem;
  background: #f1f5f9;
  color: #94a3b8;
}

.export-item-icon img,
.action-icon-wrap img,
.summary-scrip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.export-heading {
  min-width: 0;
}

.export-heading span,
.export-section-heading span,
.summary-kicker,
.score-metric-card span,
.current-action span,
.branch-list-header {
  color: #3f8f79;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0;
}

.export-heading span,
.export-section-heading span,
.summary-kicker,
.score-metric-card span,
.current-action span {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.export-heading h1 {
  margin: 0.15rem 0 0;
  color: #1e293b;
  font-size: clamp(1.15rem, 3vw, 1.65rem);
  font-weight: 950;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.export-heading p,
.export-section-heading p,
.export-how-to p {
  margin: 0.3rem 0 0;
  color: var(--fr-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.export-info-grid {
  display: grid;
  grid-template-columns: 1.25fr 1.85fr 0.95fr 1.25fr 1.25fr;
  align-items: stretch;
  gap: 0.7rem;
  border: 1px solid var(--fr-soft-border);
  border-radius: 0.85rem;
  background: rgb(255 255 255 / 0.9);
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.export-info-card {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.42rem;
  padding: 0 0 0 0.7rem;
  border-left: 1px solid var(--fr-soft-border);
}

.export-info-card:first-child {
  padding-left: 0;
  border-left: 0;
}

.export-result-section,
.export-model-section,
.export-how-to {
  min-width: 0;
  border: 1px solid var(--fr-soft-border);
  border-radius: 0.75rem;
  background: var(--fr-card);
  padding: 0.62rem;
}

.export-info-card h2,
.export-how-to h2 {
  margin: 0;
  color: #3f8f79;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.export-info-card dl,
.export-model-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
  margin: 0;
}

.export-info-card:nth-child(2) dl {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.export-info-row,
.export-model-row {
  min-width: 0;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  border: 1px solid transparent;
  border-radius: 0.55rem;
  background: rgb(248 250 252 / 0.82);
  padding: 0.35rem 0.52rem;
}

.export-info-card dt,
.export-model-row span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1.2;
  text-transform: none;
}

.export-info-card dd,
.export-model-row strong {
  min-width: 0;
  margin: 0;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1.2;
  text-align: right;
  overflow-wrap: anywhere;
}

.export-result-section,
.export-model-section {
  display: grid;
  gap: 0.85rem;
}

.export-model-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
}

.collectable-policy {
  display: grid;
  gap: 1rem;
  min-height: min(34rem, calc(100vh - 2rem));
  scroll-margin-top: 1rem;
}

.collectable-summary,
.score-metric-card,
.current-action,
.guided-panel,
.branch-row {
  border: 1px solid var(--fr-border);
  border-radius: 0.95rem;
  background: var(--fr-muted-card);
}

.collectable-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.summary-value {
  min-width: 0;
}

.collectable-summary h3 {
  margin: 0.1rem 0 0;
  color: #1e293b;
  font-size: clamp(1.7rem, 4.1vw, 2.45rem);
  font-weight: 950;
  line-height: 1;
}

.collectable-summary p,
.current-action p,
.guided-hint,
.guided-result p,
.branch-row p,
.branch-outcome small {
  margin: 0;
  color: var(--fr-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.summary-scrip {
  width: 3.75rem;
  height: 3.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: center;
  border: 1px solid rgb(187 247 208);
  border-radius: 0.85rem;
  background: white;
  box-shadow: 0 10px 22px rgb(15 23 42 / 0.08);
  color: var(--fr-accent-dark);
}

.score-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.score-metric-card {
  min-width: 0;
  padding: 0.85rem 1rem;
  background: white;
}

.score-metric-card.is-primary-metric {
  border-color: rgb(82 168 144 / 0.55);
  background: rgb(240 253 244 / 0.86);
}

.score-metric-card strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 950;
  line-height: 1;
}

.score-metric-card small {
  display: block;
  margin-top: 0.3rem;
  color: var(--fr-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.current-action {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
}

.action-icon-wrap {
  width: 3.65rem;
  height: 3.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.85rem;
  background: #ecfdf5;
  color: #3f8f79;
}

.action-icon-wrap img {
  width: 3rem;
  height: 3rem;
}

.current-action strong {
  display: block;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
}

.branch-list {
  display: grid;
  gap: 0.65rem;
  align-content: start;
  min-height: 25rem;
}

.branch-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #3f8f79;
  text-transform: none;
}

.tree-controls {
  display: flex;
  gap: 0.4rem;
}

.tree-controls button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--fr-border);
  border-radius: 0.55rem;
  background: white;
  padding: 0.32rem 0.55rem;
  color: var(--fr-accent-dark);
  font-size: 0.78rem;
  font-weight: 800;
}

.tree-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.guided-panel {
  display: grid;
  gap: 0.9rem;
  align-content: start;
  padding: 1rem;
  background: white;
}

.guided-question {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.guided-question legend,
.guided-result span {
  margin: 0;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 900;
}

.guided-question legend {
  margin-bottom: 0.42rem;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
}

.option-grid.two-options {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.choice-button {
  min-height: 2.65rem;
  border: 1px solid var(--fr-border);
  border-radius: 0.7rem;
  background: #f8fafc;
  padding: 0.55rem 0.75rem;
  color: var(--fr-accent-dark);
  font-size: 0.88rem;
  font-weight: 900;
  overflow-wrap: anywhere;
  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.choice-button:hover {
  border-color: var(--fr-accent);
  background: #f0fdf4;
  transform: translateY(-1px);
}

.choice-button.is-selected {
  border-color: var(--fr-accent);
  background: #dcfce7;
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.14);
  color: #14532d;
}

.numeric-choice {
  font-size: 1rem;
}

.guided-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 5.4rem;
  border-top: 1px solid var(--fr-border);
  padding-top: 0.9rem;
}

.guided-result strong,
.guided-result small {
  display: block;
}

.guided-result strong {
  margin-top: 0.15rem;
  color: #0f172a;
  font-size: 0.98rem;
}

.guided-result small {
  margin-top: 0.25rem;
  color: var(--fr-accent-dark);
  font-size: 0.78rem;
  font-weight: 800;
}

.guided-next-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.7rem;
  background: var(--fr-accent);
  padding: 0.55rem 0.85rem;
  color: white;
  font-size: 0.86rem;
  font-weight: 900;
}

.guided-next-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.branch-row {
  width: 100%;
  border: 1px solid var(--fr-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: white;
  text-align: left;
  transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.branch-row.is-clickable {
  cursor: pointer;
}

.branch-row.is-clickable:hover {
  border-color: var(--fr-accent);
  box-shadow: 0 10px 24px rgb(82 168 144 / 0.12);
  transform: translateY(-1px);
}

.branch-row:disabled {
  cursor: default;
}

.branch-row strong {
  color: #334155;
  font-size: 0.92rem;
}

.branch-row small {
  display: block;
  margin-top: 0.25rem;
  color: var(--fr-accent-dark);
  font-size: 0.78rem;
  font-weight: 800;
}

.branch-outcome {
  min-width: 7rem;
  text-align: right;
}

.branch-outcome span {
  display: block;
  color: var(--fr-accent-dark);
  font-weight: 900;
}

.branch-outcome i {
  display: inline-block;
  margin-top: 0.35rem;
  color: var(--fr-accent);
}

html.export-theme-dark {
  --fr-bg: #020617;
  --fr-card: #0f172a;
  --fr-muted-card: rgb(15 23 42 / 0.72);
  --fr-border: #334155;
  --fr-soft-border: #1e293b;
  --fr-text: #f8fafc;
  --fr-muted: #94a3b8;
  --fr-accent-dark: #99f6e4;
}

html.export-theme-dark body {
  background: #020617;
}

html.export-theme-dark .export-header,
html.export-theme-dark .export-info-grid,
html.export-theme-dark .export-result-section,
html.export-theme-dark .export-model-section,
html.export-theme-dark .export-how-to,
html.export-theme-dark .score-metric-card,
html.export-theme-dark .current-action,
html.export-theme-dark .guided-panel,
html.export-theme-dark .branch-row {
  background: #0f172a;
}

html.export-theme-dark .export-heading h1,
html.export-theme-dark .export-how-to h2,
html.export-theme-dark .export-info-card dd,
html.export-theme-dark .export-model-row strong,
html.export-theme-dark .collectable-summary h3,
html.export-theme-dark .score-metric-card strong,
html.export-theme-dark .current-action strong,
html.export-theme-dark .guided-question legend,
html.export-theme-dark .guided-result span,
html.export-theme-dark .guided-result strong {
  color: #f8fafc;
}

html.export-theme-dark .export-heading p,
html.export-theme-dark .export-info-card dt,
html.export-theme-dark .export-model-row span,
html.export-theme-dark .guided-hint,
html.export-theme-dark .guided-result p,
html.export-theme-dark .branch-row p,
html.export-theme-dark .branch-outcome small {
  color: #cbd5e1;
}

html.export-theme-dark .export-heading span,
html.export-theme-dark .export-info-card h2,
html.export-theme-dark .current-action span,
html.export-theme-dark .branch-list-header,
html.export-theme-dark .guided-result small {
  color: #5eead4;
}

html.export-theme-dark .export-info-row,
html.export-theme-dark .export-model-row,
html.export-theme-dark .score-metric-card.is-primary-metric {
  background: rgb(30 41 59 / 0.55);
}

html.export-theme-dark .summary-scrip,
html.export-theme-dark .tree-controls button,
html.export-theme-dark .action-icon-wrap {
  background: rgb(2 6 23 / 0.62);
  color: #99f6e4;
}

html.export-theme-dark .choice-button {
  border-color: #334155;
  background: rgb(15 23 42 / 0.72);
  color: #99f6e4;
}

html.export-theme-dark .choice-button:hover {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.22);
}

html.export-theme-dark .choice-button.is-selected {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.38);
  box-shadow: 0 0 0 3px rgb(94 234 212 / 0.12);
  color: #ccfbf1;
}

html.export-theme-dark .guided-next-button {
  background: #2dd4bf;
  color: #042f2e;
}

@media (max-width: 900px) {
  .export-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .export-info-card:nth-child(2) dl {
    grid-template-columns: 1fr;
  }

  .export-info-card {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 640px) {
  .export-info-grid {
    grid-template-columns: 1fr;
  }

  .collectable-policy {
    min-height: max(44rem, 100dvh);
  }

  .branch-list {
    min-height: 36rem;
  }

  .guided-panel {
    padding: 0.85rem;
  }

  .export-header,
  .collectable-summary,
  .score-metric-grid,
  .branch-row {
    flex-direction: column;
    align-items: stretch;
  }

  .score-metric-grid {
    grid-template-columns: 1fr;
  }

  .branch-outcome {
    text-align: left;
  }

  .branch-list-header,
  .guided-result,
  .tree-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .option-grid.two-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}`;
}

function standaloneScript() {
  return `
(function () {
  const root = document.getElementById('decision-tree-root');
  const payload = JSON.parse(document.getElementById('decision-tree-data').textContent);
  const policy = payload.policy;
  const texts = payload.texts;
  const state = {
    stack: [policy.rootNodeId],
    selections: {}
  };

  function currentNode() {
    return policy.nodes[state.stack[state.stack.length - 1]] || policy.nodes[policy.rootNodeId];
  }

  function branches() {
    return currentNode().branches || [];
  }

  function questions() {
    return currentNode().guidedQuestions || [];
  }

  function usesGuidedQuestions() {
    return questions().length > 0;
  }

  function isGuidedSelectionComplete() {
    return questions().every((question) => state.selections[question.kind] !== undefined);
  }

  function matchedGuidedBranches() {
    if (!usesGuidedQuestions() || !isGuidedSelectionComplete()) return [];

    return branches().filter((branch) => questions().every((question) => (
      branch.criteria && branch.criteria[question.kind] === state.selections[question.kind]
    )));
  }

  function selectedGuidedBranch() {
    const matches = matchedGuidedBranches();
    if (matches.length === 1) return matches[0];
    if (matches.length <= 1) return undefined;
    const routeKeys = new Set(matches.map((branch) => branch.routeKey));
    return routeKeys.size === 1 ? matches[0] : undefined;
  }

  function confluentBranch() {
    const list = branches();
    if (usesGuidedQuestions() || list.length === 0) return undefined;
    const index = currentNode().confluentBranchIndex;
    return typeof index === 'number' ? list[index] : undefined;
  }

  function resolvedGuidedBranch() {
    return selectedGuidedBranch() || confluentBranch();
  }

  function resetSelections() {
    state.selections = {};
  }

  function formatProbability(branch) {
    if (branch.probability < 0.01) return '<0.01%';
    return branch.probability.toFixed(2) + '%';
  }

  function format(template, values) {
    return template.replace(/\\{(\\w+)\\}/g, function (_, key) {
      return values[key] === undefined ? '' : String(values[key]);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderChoiceGroup(question) {
    if (!question.options.length) return '';
    const selected = state.selections[question.kind];
    return '<fieldset class="guided-question">'
      + '<legend>' + escapeHtml(question.question) + '</legend>'
      + '<div class="option-grid' + (question.options.length === 2 ? ' two-options' : '') + '">'
      + question.options.map((option) => {
        return '<button type="button" class="choice-button' + (question.numeric ? ' numeric-choice' : '') + (selected === option.value ? ' is-selected' : '') + '" data-select="' + question.kind + '" data-value="' + String(option.value) + '">'
          + escapeHtml(option.label)
          + '</button>';
      }).join('')
      + '</div></fieldset>';
  }

  function renderGuidedPanel() {
    const confluent = confluentBranch();
    const resolved = resolvedGuidedBranch();
    const hasConfluentOutcome = !!confluent && branches().length > 1;
    const hint = confluent
      ? (hasConfluentOutcome ? texts.confluentHint : texts.deterministicHint)
      : texts.confirmHint;

    const result = resolved
      ? '<template></template><div><span>' + escapeHtml(confluent ? (hasConfluentOutcome ? texts.confluentOutcome : texts.deterministicOutcome) : texts.matchedOutcome) + '</span>'
        + '<strong>' + escapeHtml(confluent ? (hasConfluentOutcome ? texts.sameOutcome : texts.readyOutcome) : resolved.labels.join(' / ')) + '</strong>'
        + '<p>' + escapeHtml(format(texts.outcomeValue, { value: resolved.outcome.collectability, integrity: resolved.outcome.integrity })) + '</p>'
        + (resolved.nextId
          ? '<small>' + escapeHtml(format(texts.nextAction, { action: policy.nodes[resolved.nextId].recommendedAction.name })) + '</small>'
          : '<small>' + escapeHtml(texts.terminal) + '</small>')
        + '</div><button type="button" class="guided-next-button" data-action="continue" ' + (!resolved.nextId ? 'disabled' : '') + '>'
        + escapeHtml(texts.continue) + '<i class="pi pi-angle-right"></i></button>'
      : '<p>' + escapeHtml(isGuidedSelectionComplete() ? texts.noMatchedOutcome : texts.waitingSelection) + '</p>';

    return '<div class="guided-panel">'
      + '<p class="guided-hint">' + escapeHtml(hint) + '</p>'
      + questions().map(renderChoiceGroup).join('')
      + '<div class="guided-result">' + result + '</div>'
      + '</div>';
  }

  function renderBranchRows() {
    return branches().map((branch, index) => {
      const next = branch.nextId ? policy.nodes[branch.nextId] : null;
      return '<button type="button" class="branch-row' + (next ? ' is-clickable' : '') + '" data-branch-index="' + index + '" ' + (!next ? 'disabled' : '') + '>'
        + '<div><strong>' + escapeHtml(branch.labels.join(' / ')) + '</strong>'
        + '<p>' + escapeHtml(branch.condition) + '</p>'
        + '<small>' + escapeHtml(next ? format(texts.nextAction, { action: next.recommendedAction.name }) : texts.terminal) + '</small></div>'
        + '<div class="branch-outcome"><span>' + escapeHtml(formatProbability(branch)) + '</span>'
        + '<small>' + escapeHtml(branch.outcome.summary) + '</small>'
        + (next ? '<i class="pi pi-angle-right"></i>' : '')
        + '</div></button>';
    }).join('');
  }

  function render() {
    const node = currentNode();
    const action = node.recommendedAction;
    const hasGuidedPanel = usesGuidedQuestions() || !!confluentBranch();
    root.innerHTML = '<section class="current-action">'
      + '<div class="action-icon-wrap">' + (action.iconUrl ? '<img src="' + escapeHtml(action.iconUrl) + '" alt="">' : '<i class="pi pi-sparkles"></i>') + '</div>'
      + '<div><span>' + escapeHtml(texts.now) + '</span><strong>' + escapeHtml(action.name) + '</strong><p>' + escapeHtml(node.stateSummary) + '</p></div>'
      + '</section>'
      + '<section class="branch-list">'
      + '<div class="branch-list-header"><span>' + escapeHtml(hasGuidedPanel ? texts.confirmOutcome : texts.nextBranches) + '</span>'
      + '<div class="tree-controls"><button type="button" data-action="back" ' + (state.stack.length <= 1 ? 'disabled' : '') + '><i class="pi pi-arrow-left"></i>' + escapeHtml(texts.back) + '</button>'
      + '<button type="button" data-action="root" ' + (state.stack.length <= 1 ? 'disabled' : '') + '><i class="pi pi-home"></i>' + escapeHtml(texts.root) + '</button></div></div>'
      + (hasGuidedPanel ? renderGuidedPanel() : renderBranchRows())
      + '</section>';
  }

  function focusDecisionTree() {
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  root.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;

    const action = button.dataset.action;
    if (action === 'back') {
      if (state.stack.length > 1) {
        state.stack.pop();
        resetSelections();
        render();
        focusDecisionTree();
      }
      return;
    }

    if (action === 'root') {
      state.stack = [policy.rootNodeId];
      resetSelections();
      render();
      focusDecisionTree();
      return;
    }

    if (action === 'continue') {
      const branch = resolvedGuidedBranch();
      if (branch && branch.nextId) {
        state.stack.push(branch.nextId);
        resetSelections();
        render();
        focusDecisionTree();
      }
      return;
    }

    if (button.dataset.select) {
      const key = button.dataset.select;
      const rawValue = button.dataset.value;
      state.selections[key] = rawValue === 'true' ? true : rawValue === 'false' ? false : Number(rawValue);
      render();
      return;
    }

    if (button.dataset.branchIndex !== undefined) {
      const branch = branches()[Number(button.dataset.branchIndex)];
      if (branch && branch.nextId) {
        state.stack.push(branch.nextId);
        resetSelections();
        render();
        focusDecisionTree();
      }
    }
  });

  render();
})();
`;
}
