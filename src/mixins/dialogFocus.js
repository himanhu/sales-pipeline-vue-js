import { focusableElements } from '../utils/focus.js';

// BaseDialog teleports to body so background siblings can be made inert.
export default {
  data() {
    return { previousFocus: null, restoreFocus: true, backgroundElements: [], previousBodyOverflow: '' };
  },
  mounted() {
    this.previousFocus = document.activeElement;
    const backdrop = this.$refs.dialogEl.parentElement;
    this.backgroundElements = [...document.body.children]
      .filter(element => element !== backdrop)
      .map(element => ({ element, inert: element.inert }));
    for (const { element } of this.backgroundElements) element.inert = true;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('focusin', this.keepFocusInside);
    this.$nextTick(this.focusFirstControl);
  },
  beforeUnmount() {
    document.removeEventListener('focusin', this.keepFocusInside);
    for (const { element, inert } of this.backgroundElements) element.inert = inert;
    document.body.style.overflow = this.previousBodyOverflow;
  },
  unmounted() {
    if (this.restoreFocus) {
      this.$nextTick(() => {
        const previous = this.previousFocus;
        if (previous?.isConnected && !previous.matches(':disabled') && previous.getClientRects().length) {
          previous.focus();
        } else {
          document.getElementById('main-content')?.focus();
        }
      });
    }
  },
  methods: {
    focusFirstControl() {
      const dialog = this.$refs.dialogEl;
      if (dialog) (focusableElements(dialog)[0] ?? dialog).focus();
    },
    keepFocusInside(event) {
      if (!this.$refs.dialogEl?.contains(event.target)) this.focusFirstControl();
    },
    trapTab(event) {
      if (event.key !== 'Tab') return;
      const controls = focusableElements(event.currentTarget);
      if (!controls.length) {
        event.preventDefault();
        event.currentTarget.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    skipFocusRestore() { this.restoreFocus = false; },
  },
};
