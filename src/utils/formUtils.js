export function focusFirstInvalidField(formEl) {
  if (!formEl) return;
  const target =
    formEl.querySelector('[data-invalid="true"]') ||
    formEl.querySelector('input:invalid, textarea:invalid, select:invalid');
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

