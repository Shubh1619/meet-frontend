export function focusFirstInvalidField(formEl) {
  if (!formEl) return;
  const target =
    formEl.querySelector('[data-invalid="true"]') ||
    formEl.querySelector('input:invalid, textarea:invalid, select:invalid');
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test((value || "").trim().toLowerCase());
}

export function parseCommaSeparatedEmails(value) {
  const emails = (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const invalidEmails = emails.filter((email) => !isValidEmail(email));
  return { emails, invalidEmails };
}

export function formatApiError(detail, fallback = "Something went wrong.") {
  if (typeof detail === "string" && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => formatApiError(item, ""))
      .filter(Boolean);
    return messages.length ? messages.join(", ") : fallback;
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.msg === "string" && detail.msg.trim()) return detail.msg.trim();
    if (typeof detail.message === "string" && detail.message.trim()) return detail.message.trim();
    if (typeof detail.detail === "string" && detail.detail.trim()) return detail.detail.trim();
    if (typeof detail.error === "string" && detail.error.trim()) return detail.error.trim();
  }

  return fallback;
}
