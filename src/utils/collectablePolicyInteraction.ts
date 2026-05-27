import type { CollectablePolicyBranch } from '../types/collectable';

export type CollectableGuidedQuestionKind =
  | 'collectSuccess'
  | 'standard'
  | 'wise'
  | 'revisit'
  | 'collectability'
  | 'integrity';

export interface CollectableGuidedOption {
  value: boolean | number;
  label: string;
}

export interface CollectableGuidedQuestion {
  kind: CollectableGuidedQuestionKind;
  question: string;
  options: CollectableGuidedOption[];
  numeric: boolean;
}

export type CollectableGuidedSelections = Partial<Record<CollectableGuidedQuestionKind, boolean | number>>;

export interface CollectableGuidedQuestionLabels {
  collectQuestion: string;
  standardQuestion: string;
  wiseQuestion: string;
  revisitQuestion: string;
  collectabilityQuestion: string;
  integrityQuestion: string;
  integrityOption: (integrity: number) => string;
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
}

export interface CollectableBranchRouteLike {
  outcome: {
    gp: number;
    integrity: number;
    collectability: number;
  };
  next?: unknown;
  nextId?: string | null;
}

export interface CollectableBranchLabelLike extends CollectableBranchRouteLike {
  labelKey: string;
  labelKeys?: string[];
}

export function buildCollectableGuidedQuestions(
  branches: CollectablePolicyBranch[],
  labels: CollectableGuidedQuestionLabels
): CollectableGuidedQuestion[] {
  return [
    buildBooleanQuestion(
      branches,
      'collectSuccess',
      labels.collectQuestion,
      'collectableSolver.branches.collectSuccess',
      'collectableSolver.branches.collectFailed',
      labels.collectOptions.success,
      labels.collectOptions.failed
    ),
    buildBooleanQuestion(
      branches,
      'standard',
      labels.standardQuestion,
      'collectableSolver.branches.standardProc',
      'collectableSolver.branches.standardNoProc',
      labels.standardOptions.proc,
      labels.standardOptions.noProc
    ),
    buildBooleanQuestion(
      branches,
      'wise',
      labels.wiseQuestion,
      'collectableSolver.branches.wiseProc',
      'collectableSolver.branches.wiseNoProc',
      labels.wiseOptions.proc,
      labels.wiseOptions.noProc
    ),
    buildBooleanQuestion(
      branches,
      'revisit',
      labels.revisitQuestion,
      'collectableSolver.branches.revisitProc',
      'collectableSolver.branches.revisitNoProc',
      labels.revisitOptions.proc,
      labels.revisitOptions.noProc
    ),
    buildNumericQuestion(
      collectabilityOptions(branches),
      'collectability',
      labels.collectabilityQuestion,
      (value) => String(value)
    ),
    buildNumericQuestion(
      integrityOptions(branches),
      'integrity',
      labels.integrityQuestion,
      labels.integrityOption
    )
  ].filter((question): question is CollectableGuidedQuestion => question !== null);
}

export function collectableGuidedSelectionComplete(
  questions: CollectableGuidedQuestion[],
  selections: CollectableGuidedSelections
) {
  return questions.every((question) => selections[question.kind] !== undefined);
}

export function collectableBranchMatchesGuidedSelections(
  branch: CollectablePolicyBranch,
  questions: CollectableGuidedQuestion[],
  selections: CollectableGuidedSelections
) {
  for (const question of questions) {
    const selected = selections[question.kind];
    if (selected === undefined) return false;

    if (question.kind === 'collectSuccess') {
      const isCollectSuccess = hasBranchLabel(branch, 'collectableSolver.branches.collectSuccess');
      if (selected !== isCollectSuccess) return false;
    } else if (question.kind === 'standard') {
      const isStandardProc = hasBranchLabel(branch, 'collectableSolver.branches.standardProc');
      if (selected !== isStandardProc) return false;
    } else if (question.kind === 'wise') {
      const isWiseProc = hasBranchLabel(branch, 'collectableSolver.branches.wiseProc');
      if (selected !== isWiseProc) return false;
    } else if (question.kind === 'revisit') {
      const isRevisitProc = hasBranchLabel(branch, 'collectableSolver.branches.revisitProc');
      if (selected !== isRevisitProc) return false;
    } else if (question.kind === 'collectability') {
      if (selected !== branch.outcome.collectability) return false;
    } else if (question.kind === 'integrity') {
      if (selected !== branch.outcome.integrity) return false;
    }
  }

  return true;
}

export function matchedCollectableGuidedBranches(
  branches: CollectablePolicyBranch[],
  questions: CollectableGuidedQuestion[],
  selections: CollectableGuidedSelections
) {
  if (!questions.length || !collectableGuidedSelectionComplete(questions, selections)) return [];
  return branches.filter((branch) => collectableBranchMatchesGuidedSelections(branch, questions, selections));
}

export function selectedCollectableGuidedBranch(
  branches: CollectablePolicyBranch[],
  questions: CollectableGuidedQuestion[],
  selections: CollectableGuidedSelections
) {
  const matches = matchedCollectableGuidedBranches(branches, questions, selections);
  if (matches.length === 1) return matches[0];
  if (matches.length <= 1) return undefined;

  const routeKeys = new Set(matches.map((branch) => collectableBranchRouteKey(branch)));
  return routeKeys.size === 1 ? matches[0] : undefined;
}

export function confluentCollectableBranch(
  branches: CollectablePolicyBranch[],
  questions: CollectableGuidedQuestion[]
) {
  if (questions.length || branches.length === 0) return undefined;

  const routeKeys = new Set(branches.map((branch) => collectableBranchRouteKey(branch)));
  return routeKeys.size === 1 ? branches[0] : undefined;
}

export function resolvedCollectableGuidedBranch(
  branches: CollectablePolicyBranch[],
  questions: CollectableGuidedQuestion[],
  selections: CollectableGuidedSelections
) {
  return selectedCollectableGuidedBranch(branches, questions, selections)
    ?? confluentCollectableBranch(branches, questions);
}

export function hasBranchLabel(branch: CollectableBranchLabelLike, labelKey: string) {
  return (branch.labelKeys ?? [branch.labelKey]).includes(labelKey);
}

export function collectableBranchRouteKey(branch: CollectableBranchRouteLike) {
  const nextId = 'nextId' in branch ? branch.nextId : undefined;
  const nextObjectId = branch.next && typeof branch.next === 'object' && 'id' in branch.next
    ? String(branch.next.id)
    : undefined;

  return [
    branch.outcome.gp,
    branch.outcome.integrity,
    branch.outcome.collectability,
    nextId ?? nextObjectId ?? (branch.next ? 'next' : 'terminal')
  ].join('|');
}

function buildBooleanQuestion(
  branches: CollectablePolicyBranch[],
  kind: CollectableGuidedQuestionKind,
  question: string,
  trueLabelKey: string,
  falseLabelKey: string,
  trueLabel: string,
  falseLabel: string
): CollectableGuidedQuestion | null {
  const hasTrue = branches.some((branch) => hasBranchLabel(branch, trueLabelKey));
  const hasFalse = branches.some((branch) => hasBranchLabel(branch, falseLabelKey));
  if (!hasTrue || !hasFalse) return null;

  return {
    kind,
    question,
    numeric: false,
    options: [
      { value: true, label: trueLabel },
      { value: false, label: falseLabel }
    ]
  };
}

function buildNumericQuestion(
  values: number[],
  kind: CollectableGuidedQuestionKind,
  question: string,
  formatLabel: (value: number) => string
): CollectableGuidedQuestion | null {
  if (values.length <= 1) return null;

  return {
    kind,
    question,
    numeric: true,
    options: values.map((value) => ({
      value,
      label: formatLabel(value)
    }))
  };
}

function collectabilityOptions(branches: CollectablePolicyBranch[]) {
  const hasValueOutcome = branches.some((branch) => (
    hasBranchLabel(branch, 'collectableSolver.branches.valueNormal')
    || hasBranchLabel(branch, 'collectableSolver.branches.valueIncreased')
  ));
  if (!hasValueOutcome) return [];
  return uniqueNumbers(branches.map((branch) => branch.outcome.collectability));
}

function integrityOptions(branches: CollectablePolicyBranch[]) {
  const hasMeticulousOutcome = branches.some((branch) => (
    hasBranchLabel(branch, 'collectableSolver.branches.meticulousSaved')
    || hasBranchLabel(branch, 'collectableSolver.branches.meticulousConsumed')
  ));
  if (!hasMeticulousOutcome) return [];
  return uniqueNumbers(branches.map((branch) => branch.outcome.integrity));
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}
