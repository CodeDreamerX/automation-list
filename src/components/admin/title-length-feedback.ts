function applyTitleLengthColor(input: HTMLInputElement) {
  const len = input.value.length;
  if (len >= 60) {
    input.style.backgroundColor = '#fee2e2'; // red-100
  } else if (len >= 50) {
    input.style.backgroundColor = '#fef9c3'; // yellow-100
  } else {
    input.style.backgroundColor = '';
  }
}

export function initTitleLengthFeedback(ids: string[]) {
  for (const id of ids) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) continue;
    applyTitleLengthColor(el);
    el.addEventListener('input', () => applyTitleLengthColor(el));
  }
}
