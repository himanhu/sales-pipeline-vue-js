import test from 'node:test';
import assert from 'node:assert/strict';
import { focusableElements } from '../src/utils/focus.js';
import dialogFocus from '../src/mixins/dialogFocus.js';

function control(options = {}) {
  return {
    tabIndex: 0,
    matches: () => false,
    closest: () => null,
    getClientRects: () => [{}],
    focus() { globalThis.document.activeElement = this; },
    ...options,
  };
}

function withDocument(run) {
  const previousDocument = globalThis.document;
  const previousStyle = globalThis.getComputedStyle;
  globalThis.document = { activeElement: null };
  globalThis.getComputedStyle = element => ({ visibility: element.visibility ?? 'visible' });
  try { run(); }
  finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousStyle === undefined) delete globalThis.getComputedStyle; else globalThis.getComputedStyle = previousStyle;
  }
}

test('focus candidates include textareas and exclude disabled, inert, hidden, and negative-tabindex controls', () => {
  withDocument(() => {
    const textarea = control();
    const button = control();
    const candidates = [textarea, button,
      control({ matches: () => true }),
      control({ closest: () => ({ inert: true }) }),
      control({ getClientRects: () => [] }),
      control({ tabIndex: -1 }),
      control({ visibility: 'hidden' }),
    ];
    const container = { querySelectorAll(selector) { assert.ok(selector.includes('textarea')); return candidates; } };
    assert.deepEqual(focusableElements(container), [textarea, button]);
  });
});

test('Tab and Shift+Tab wrap between the last and first available modal controls', () => {
  withDocument(() => {
    const first = control();
    const last = control();
    const dialog = { querySelectorAll: () => [first, last] };
    let prevented = 0;
    document.activeElement = last;
    dialogFocus.methods.trapTab({ key: 'Tab', currentTarget: dialog, preventDefault() { prevented++; } });
    assert.equal(document.activeElement, first);
    dialogFocus.methods.trapTab({ key: 'Tab', shiftKey: true, currentTarget: dialog, preventDefault() { prevented++; } });
    assert.equal(document.activeElement, last);
    assert.equal(prevented, 2);
  });
});

test('a modal without available controls retains focus on its dialog container', () => {
  withDocument(() => {
    const dialog = control({ querySelectorAll: () => [] });
    let prevented = false;
    dialogFocus.methods.trapTab({ key: 'Tab', currentTarget: dialog, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(document.activeElement, dialog);
  });
});

test('modal lifecycle preserves existing inert state, restores scrolling, and returns focus', () => {
  withDocument(() => {
    const opener = control({ isConnected: true });
    document.activeElement = opener;
    const background = { inert: false };
    const alreadyInert = { inert: true };
    const backdrop = {};
    const listeners = new Map();
    document.body = { children: [background, alreadyInert, backdrop], style: { overflow: 'auto' } };
    document.addEventListener = (event, handler) => listeners.set(event, handler);
    document.removeEventListener = event => listeners.delete(event);
    const first = control();
    const dialog = { parentElement: backdrop, querySelectorAll: () => [first] };
    const vm = { ...dialogFocus.data(), $refs: { dialogEl: dialog }, $nextTick: callback => callback() };
    for (const [name, method] of Object.entries(dialogFocus.methods)) vm[name] = method.bind(vm);
    dialogFocus.mounted.call(vm);
    assert.equal(background.inert, true);
    assert.equal(alreadyInert.inert, true);
    assert.equal(document.body.style.overflow, 'hidden');
    assert.equal(document.activeElement, first);
    dialogFocus.beforeUnmount.call(vm);
    dialogFocus.unmounted.call(vm);
    assert.equal(background.inert, false);
    assert.equal(alreadyInert.inert, true);
    assert.equal(document.body.style.overflow, 'auto');
    assert.equal(document.activeElement, opener);
    assert.equal(listeners.size, 0);
  });
});

test('closing a dialog whose trigger is now disabled restores focus to main content', () => {
  withDocument(() => {
    const main = control();
    document.getElementById = id => id === 'main-content' ? main : null;
    dialogFocus.unmounted.call({
      restoreFocus: true,
      previousFocus: control({ isConnected: true, matches: () => true }),
      $nextTick: callback => callback(),
    });
    assert.equal(document.activeElement, main);
  });
});
