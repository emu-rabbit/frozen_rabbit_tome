import { describe, expect, it } from 'vitest';
import {
  buildCollectableDecisionTreeHtml,
  buildCollectableDecisionTreeSnapshot,
  buildCollectableStrategyDecisionTreeSnapshot,
  buildHtmlExportFileName,
  sanitizeHtmlFileName,
  type CollectableDecisionTreeHtmlDocument
} from './collectableDecisionTreeHtmlExport';
import type { CollectablePolicyNode } from '../types/collectable';
import type { CollectableStrategyNode } from './collectableStrategyTree';

const terminalNode: CollectablePolicyNode = {
  id: 'terminal',
  state: {
    gp: 900,
    integrity: 3,
    collectability: 200,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    successBonus: 0,
    nextCollectSuccessBonus: 0,
    wiseToTheWorldActive: false
  },
  recommendedAction: {
    kind: 'collect',
    nameKey: 'collectableSolver.actions.collect',
    gpCost: 0
  },
  expectedScore: 100,
  expectedReward: { exp: 0, gil: 0, scrip: 100, items: {} },
  expectedTierCounts: { none: 0, low: 0, mid: 0, high: 1 },
  branches: []
};

const rootNode: CollectablePolicyNode = {
  id: 'root',
  state: {
    gp: 930,
    integrity: 4,
    collectability: 0,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    successBonus: 0,
    nextCollectSuccessBonus: 0,
    wiseToTheWorldActive: false
  },
  recommendedAction: {
    kind: 'meticulous',
    nameKey: 'collectableSolver.actions.meticulous',
    gpCost: 0
  },
  expectedScore: 80,
  expectedReward: { exp: 0, gil: 0, scrip: 80, items: {} },
  expectedTierCounts: { none: 0, low: 0, mid: 0.5, high: 0.5 },
  branches: [{
    labelKey: 'collectableSolver.branches.valueIncreased',
    labelKeys: [
      'collectableSolver.branches.valueIncreased',
      'collectableSolver.branches.meticulousSaved'
    ],
    conditionKey: 'collectableSolver.conditions.refineOutcome',
    probability: 50,
    outcome: {
      gp: 930,
      integrity: 4,
      collectability: 200,
      reward: { exp: 0, gil: 0, scrip: 0, items: {} },
      score: 100
    },
    next: terminalNode
  }]
};

describe('collectableDecisionTreeHtmlExport', () => {
  it('serializes the policy graph with branch keys for the guided runtime', () => {
    const snapshot = buildCollectableDecisionTreeSnapshot(rootNode, {
      actionName: (kind) => `action:${kind}`,
      actionIcon: (kind) => `https://example.test/${kind}.png`,
      branchLabel: (key) => `label:${key}`,
      conditionLabel: (key) => `condition:${key}`,
      formatStateSummary: (state) => `GP ${state.gp} / Integrity ${state.integrity} / Collectability ${state.collectability}`,
      guidedQuestionLabels: guidedQuestionLabels()
    });

    expect(snapshot.rootNodeId).toBe('root');
    expect(snapshot.nodeOrder).toEqual(['root', 'terminal']);
    expect(snapshot.nodes.root.branches[0]).toMatchObject({
      labelKeys: [
        'collectableSolver.branches.valueIncreased',
        'collectableSolver.branches.meticulousSaved'
      ],
      labels: [
        'label:collectableSolver.branches.valueIncreased',
        'label:collectableSolver.branches.meticulousSaved'
      ],
      criteria: {},
      nextId: 'terminal'
    });
    expect(snapshot.nodes.root.guidedQuestions).toEqual([]);
    expect(snapshot.nodes.root.confluentBranchIndex).toBe(0);
  });

  it('builds a standalone HTML document with escaped data and runtime hooks', () => {
    const snapshot = buildCollectableDecisionTreeSnapshot(rootNode, {
      actionName: (kind) => `action:${kind}`,
      actionIcon: () => '',
      branchLabel: (key) => key,
      conditionLabel: (key) => key,
      formatStateSummary: (state) => `GP ${state.gp} / Integrity ${state.integrity} / Collectability ${state.collectability}`,
      guidedQuestionLabels: guidedQuestionLabels()
    });
    const html = buildCollectableDecisionTreeHtml(buildDocument(snapshot));

    expect(html).toContain('&lt;Rarefied&gt; Ore Collectable Decision Tree');
    expect(html).toContain('<html lang="en" class="export-theme-light">');
    expect(html).toContain('Solver Inputs and Conditions');
    expect(html).toContain('collectableSolver.branches.valueIncreased');
    expect(html).toContain('decision-tree-data');
    expect(html).toContain('data-action=\"continue\"');
    expect(html).toContain('currentNode().guidedQuestions');
    expect(html).not.toContain('<Rarefied> Ore Collectable Decision Tree');
  });

  it('serializes experiment strategy trees with terminal status nodes', () => {
    const strategyRoot: CollectableStrategyNode = {
      id: 'strategy-root',
      state: {
        gp: 900,
        integrity: 4,
        collectability: 0,
        scrutinyActive: false,
        collectorsFocusActive: false,
        primingTouchActive: false,
        standardActive: false,
        successBonus: 0,
        nextCollectSuccessBonus: 0,
        wiseToTheWorldActive: false,
        hasUsedCollectableAction: false,
        hasCollected: false,
        successIActive: false,
        successIIActive: false,
        successIIIActive: false
      },
      path: [],
      status: 'decided',
      matchedRuleId: 'rule-1',
      matchedRuleName: 'Raise value',
      action: 'meticulous',
      pendingActions: [],
      branches: [{
        label: 'Value increased',
        labelKeys: ['collectableSolver.branches.valueIncreased'],
        probability: 100,
        state: {
          gp: 900,
          integrity: 3,
          collectability: 200,
          scrutinyActive: false,
          collectorsFocusActive: false,
          primingTouchActive: false,
          standardActive: false,
          successBonus: 0,
          nextCollectSuccessBonus: 0,
          wiseToTheWorldActive: false,
          hasUsedCollectableAction: true,
          hasCollected: false,
          successIActive: false,
          successIIActive: false,
          successIIIActive: false
        },
        child: {
          id: 'strategy-terminal',
          state: {
            gp: 900,
            integrity: 0,
            collectability: 200,
            scrutinyActive: false,
            collectorsFocusActive: false,
            primingTouchActive: false,
            standardActive: false,
            successBonus: 0,
            nextCollectSuccessBonus: 0,
            wiseToTheWorldActive: false,
            hasUsedCollectableAction: true,
            hasCollected: false,
            successIActive: false,
            successIIActive: false,
            successIIIActive: false
          },
          path: [],
          status: 'terminal',
          pendingActions: [],
          branches: []
        }
      }]
    };

    const snapshot = buildCollectableStrategyDecisionTreeSnapshot(strategyRoot, {
      actionName: (kind) => `action:${kind}`,
      actionIcon: () => '',
      branchLabel: (key) => `label:${key}`,
      conditionLabel: (key) => key,
      formatStateSummary: (state) => `GP ${state.gp} / Integrity ${state.integrity} / Collectability ${state.collectability}`,
      statusLabel: (status) => `status:${status}`,
      guidedQuestionLabels: guidedQuestionLabels()
    });

    expect(snapshot.nodeOrder).toEqual(['strategy-root', 'strategy-terminal']);
    expect(snapshot.nodes['strategy-root'].recommendedAction?.name).toBe('action:meticulous');
    expect(snapshot.nodes['strategy-terminal']).toMatchObject({
      status: 'terminal',
      statusLabel: 'status:terminal',
      recommendedAction: null
    });
    expect(snapshot.nodes['strategy-root'].branches[0]).toMatchObject({
      labels: ['label:collectableSolver.branches.valueIncreased'],
      nextId: 'strategy-terminal'
    });
  });

  it('sanitizes generated html filenames', () => {
    expect(sanitizeHtmlFileName('Bad:Item?/Tree.html')).toBe('Bad-Item--Tree.html');
    expect(buildHtmlExportFileName({
      item: { itemId: 1, nameLocale: '測試:收藏品', nameEn: 'Test' },
      scenarioLabel: '互動/決策樹',
      generatedAt: new Date('2026-05-27T00:00:00.000Z')
    })).toBe('測試-收藏品 - 互動-決策樹 - 2026-05-27.html');
  });
});

function buildDocument(policy: CollectableDecisionTreeHtmlDocument['policy']): CollectableDecisionTreeHtmlDocument {
  return {
    locale: 'en',
    generatedAt: '2026-05-27T00:00:00.000Z',
    theme: 'light',
    item: {
      itemId: 1,
      nameLocale: '<Rarefied> Ore',
      nameEn: 'Rarefied Ore',
      iconUrl: ''
    },
    texts: {
      documentTitle: '<Rarefied> Ore Collectable Decision Tree',
      appTitle: 'Frozen Rabbit Tome',
      appSubtitle: 'Recommended Policy',
      inputTitle: 'Solver Inputs and Conditions',
      resultTitle: 'Recommended Policy',
      modelVersionsTitle: 'Model Versions',
      howToReadTitle: 'How To Read',
      howToReadDescription: 'Follow the branch that matches the game result.',
      generatedAt: 'Exported At',
      policy: {
        now: 'Use Now',
        confirmOutcome: 'Confirm Current Result',
        nextBranches: 'Possible Branches',
        confirmHint: 'Check the game UI.',
        confluentHint: 'These outcomes converge.',
        deterministicHint: 'Only one result.',
        collectQuestion: 'Did Collect succeed?',
        standardQuestion: 'Did Standard proc?',
        wiseQuestion: 'Did Wise proc?',
        revisitQuestion: 'Did Revisit trigger?',
        collectabilityQuestion: 'Current collectability?',
        integrityQuestion: 'Current integrity?',
        integrityOption: '{integrity} integrity',
        collectOptions: {
          success: 'Success',
          failed: 'Failed'
        },
        standardOptions: {
          proc: 'Triggered',
          noProc: 'Not triggered'
        },
        wiseOptions: {
          proc: 'Triggered',
          noProc: 'Not triggered'
        },
        revisitOptions: {
          proc: 'Triggered',
          noProc: 'Not triggered'
        },
        matchedOutcome: 'Matched Outcome',
        confluentOutcome: 'Converged Outcome',
        deterministicOutcome: 'Fixed Outcome',
        sameOutcome: 'Same outcome',
        readyOutcome: 'Ready',
        waitingSelection: 'Waiting',
        noMatchedOutcome: 'No match',
        continue: 'Next Step',
        outcomeValue: 'Collectability {value}, integrity {integrity}',
        nextAction: 'Next: {action}',
        terminal: 'Completed',
        back: 'Back',
        root: 'Root'
      }
    },
    inputSections: [{
      title: 'Item',
      rows: [{ label: 'Item ID', value: '1' }]
    }],
    resultMetrics: [{
      label: 'Expected',
      value: '80',
      primary: true
    }],
    modelVersionRows: [{
      label: 'collectableSolver',
      value: 'collectable-solver-v1'
    }],
    policy
  };
}

function guidedQuestionLabels() {
  return {
    collectQuestion: 'Did Collect succeed?',
    standardQuestion: 'Did Standard proc?',
    wiseQuestion: 'Did Wise proc?',
    revisitQuestion: 'Did Revisit trigger?',
    collectabilityQuestion: 'Current collectability?',
    integrityQuestion: 'Current integrity?',
    integrityOption: (integrity: number) => `${integrity} integrity`,
    collectOptions: {
      success: 'Success',
      failed: 'Failed'
    },
    standardOptions: {
      proc: 'Triggered',
      noProc: 'Not triggered'
    },
    wiseOptions: {
      proc: 'Triggered',
      noProc: 'Not triggered'
    },
    revisitOptions: {
      proc: 'Triggered',
      noProc: 'Not triggered'
    }
  };
}
