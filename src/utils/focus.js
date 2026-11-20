const FOCUSABLE_SELECTOR = 'button, input, select, textarea, a[href], [tabindex], [contenteditable="true"]';

export function focusableElements(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element =>
    element.tabIndex >= 0
    && !element.matches(':disabled, input[type="hidden"]')
    && !element.closest('[hidden], [inert]')
    && element.getClientRects().length > 0
    && getComputedStyle(element).visibility !== 'hidden');
}
