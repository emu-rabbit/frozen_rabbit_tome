// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import FloatingJsonExportButton from './FloatingJsonExportButton.vue';

describe('FloatingJsonExportButton', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('teleports the fixed export button to the document body', async () => {
    const wrapper = mount(FloatingJsonExportButton, {
      props: {
        label: 'Export JSON',
        exportedLabel: 'Exported JSON'
      }
    });

    const button = document.body.querySelector<HTMLButtonElement>('.floating-json-export-button');

    expect(button).not.toBeNull();
    expect(button?.parentElement).toBe(document.body);
    expect(button?.getAttribute('aria-label')).toBe('Export JSON');

    button?.click();

    expect(wrapper.emitted('click')).toHaveLength(1);

    wrapper.unmount();
  });
});
