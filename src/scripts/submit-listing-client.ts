export interface SubmitListingStrings {
  countryNoResults: string;
  section2Hide: string;
  section2Show: string;
  validateBanner: string;
  submitSubmitting: string;
  submitButton: string;
  errorGeneric: string;
  errorNetwork: string;
}

export type SubmitListingCountryConfig =
  | { mode: 'en'; countries: readonly string[] }
  | { mode: 'de'; pairs: readonly { en: string; de: string }[] };

export interface SubmitListingInitOptions {
  strings: SubmitListingStrings;
  country: SubmitListingCountryConfig;
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

export function initSubmitListing(options: SubmitListingInitOptions): void {
  const { strings, country: countryCfg } = options;

  const countryInput = el<HTMLInputElement>('country-input');
  const countryValue = el<HTMLInputElement>('country-value');
  const countryDropdown = el<HTMLElement>('country-dropdown');
  /** Wraps label + input + dropdown (+ error); used for outside-dismiss. */
  const countryFieldRoot = el<HTMLElement>('country-field');

  function buildCountryDropdown(query: string) {
    const q = query.trim().toLowerCase();
    const optClass =
      'country-opt px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-800';
    if (countryCfg.mode === 'en') {
      const list = countryCfg.countries;
      const matches = q ? list.filter(c => c.toLowerCase().includes(q)) : [...list];
      countryDropdown.innerHTML = matches.length
        ? matches
            .map(
              c =>
                `<div class="${optClass}" data-value="${c}">${c}</div>`
            )
            .join('')
        : `<div class="px-3 py-2 text-gray-400 text-sm">${strings.countryNoResults}</div>`;
    } else {
      const pairs = countryCfg.pairs;
      const matches = q
        ? pairs.filter(
            ({ en, de }) =>
              en.toLowerCase().includes(q) || de.toLowerCase().includes(q)
          )
        : [...pairs];
      countryDropdown.innerHTML = matches.length
        ? matches
            .map(
              ({ en, de }) =>
                `<div class="${optClass}" data-value="${en}">${de}</div>`
            )
            .join('')
        : `<div class="px-3 py-2 text-gray-400 text-sm">${strings.countryNoResults}</div>`;
    }
  }

  countryInput.addEventListener('input', () => {
    countryValue.value = '';
    if (countryInput.value.trim()) {
      buildCountryDropdown(countryInput.value);
      countryDropdown.classList.remove('hidden');
      countryInput.setAttribute('aria-expanded', 'true');
    } else {
      countryDropdown.classList.add('hidden');
      countryInput.setAttribute('aria-expanded', 'false');
    }
  });

  countryDropdown.addEventListener('mousedown', e => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const opt = t.closest('.country-opt');
    if (!(opt instanceof HTMLElement)) return;
    e.preventDefault();
    if (countryCfg.mode === 'en') {
      const v = opt.dataset.value ?? '';
      countryInput.value = v;
      countryValue.value = v;
    } else {
      countryInput.value = opt.textContent?.trim() ?? '';
      countryValue.value = opt.dataset.value ?? '';
    }
    countryDropdown.classList.add('hidden');
    countryInput.setAttribute('aria-expanded', 'false');
    clearFieldError('country-input', 'country-error');
  });

  function applyCountryDismissRules() {
    if (countryCfg.mode === 'en') {
      if (
        countryInput.value &&
        !countryCfg.countries.includes(countryInput.value)
      ) {
        countryInput.value = '';
        countryValue.value = '';
      }
    } else if (countryInput.value && !countryValue.value) {
      countryInput.value = '';
    }
  }

  function hideCountryDropdown() {
    countryDropdown.classList.add('hidden');
    countryInput.setAttribute('aria-expanded', 'false');
    applyCountryDismissRules();
  }

  /** `click` after `input` can fire from touch/pen/OS UI and wrongly close the list; `pointerdown` does not fire when typing with a physical keyboard. */
  document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (countryFieldRoot.contains(t)) return;
    hideCountryDropdown();
  });

  countryInput.addEventListener('blur', () => {
    requestAnimationFrame(() => {
      if (!countryFieldRoot.contains(document.activeElement)) {
        hideCountryDropdown();
      }
    });
  });

  const s2Toggle = el<HTMLElement>('section2-toggle');
  const s2Content = el<HTMLElement>('section2-content');
  const s2Chevron = el<HTMLElement>('section2-chevron');
  const s2Label = el<HTMLElement>('section2-label');

  s2Toggle.addEventListener('click', () => {
    const opening = s2Content.classList.contains('hidden');
    s2Content.classList.toggle('hidden', !opening);
    s2Chevron.style.transform = opening ? 'rotate(180deg)' : '';
    s2Label.textContent = opening ? strings.section2Hide : strings.section2Show;
  });

  const toggleOpts = document.querySelectorAll<HTMLElement>('.toggle-opt');
  const tnpInput = el<HTMLInputElement>('taking-new-projects');

  toggleOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleOpts.forEach(b => {
        b.classList.remove('bg-gray-900', 'text-white', 'border-gray-900');
        b.classList.add('text-gray-600', 'border-gray-300');
      });
      btn.classList.remove('text-gray-600', 'border-gray-300');
      btn.classList.add('bg-gray-900', 'text-white', 'border-gray-900');
      tnpInput.value = btn.dataset.value ?? '';
    });
  });

  function markError(inputEl: HTMLElement | null, errorId: string) {
    if (inputEl) inputEl.classList.add('!border-red-400', 'focus:!ring-red-300');
    document.getElementById(errorId)?.classList.remove('hidden');
  }

  function clearFieldError(inputId: string | HTMLElement, errorId: string) {
    const node =
      typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
    if (node) node.classList.remove('!border-red-400', 'focus:!ring-red-300');
    document.getElementById(errorId)?.classList.add('hidden');
  }

  function clearAllErrors() {
    document.querySelectorAll('[id$="-error"]').forEach(node => node.classList.add('hidden'));
    document.querySelectorAll('.sl-input').forEach(node =>
      node.classList.remove('!border-red-400', 'focus:!ring-red-300')
    );
    el<HTMLElement>('error-banner').classList.add('hidden');
  }

  function showBanner(msg: string) {
    const banner = el<HTMLElement>('error-banner');
    el<HTMLElement>('error-message').textContent = msg;
    banner.classList.remove('hidden');
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function validateForm() {
    let valid = true;

    const nameEl = el<HTMLInputElement>('name');
    if (!nameEl.value.trim()) {
      markError(nameEl, 'name-error');
      valid = false;
    } else clearFieldError(nameEl, 'name-error');

    const websiteEl = el<HTMLInputElement>('website');
    const wsRaw = websiteEl.value.trim();
    const wsNorm =
      wsRaw.startsWith('http://') || wsRaw.startsWith('https://')
        ? wsRaw
        : 'https://' + wsRaw;
    try {
      if (!wsRaw) throw new Error('empty');
      new URL(wsNorm);
      websiteEl.value = wsNorm;
      clearFieldError(websiteEl, 'website-error');
    } catch {
      markError(websiteEl, 'website-error');
      valid = false;
    }

    const emailEl = el<HTMLInputElement>('email');
    if (
      !emailEl.value.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)
    ) {
      markError(emailEl, 'email-error');
      valid = false;
    } else clearFieldError(emailEl, 'email-error');

    if (!countryValue.value) {
      markError(countryInput, 'country-error');
      valid = false;
    } else clearFieldError(countryInput, 'country-error');

    const catChecked = document.querySelectorAll<HTMLInputElement>(
      '[name="category_slugs"]:checked'
    );
    const catErrEl = el<HTMLElement>('categories-error');
    if (catChecked.length === 0) {
      catErrEl.classList.remove('hidden');
      valid = false;
    } else catErrEl.classList.add('hidden');

    const descEnEl = el<HTMLTextAreaElement>('description_en');
    if (!descEnEl.value.trim()) {
      markError(descEnEl, 'description_en-error');
      valid = false;
    } else clearFieldError(descEnEl, 'description_en-error');

    return valid;
  }

  function collectPayload(isSuspect: boolean) {
    const yearVal = el<HTMLInputElement>('year_founded').value;
    const tnpVal = tnpInput.value;

    return {
      name: el<HTMLInputElement>('name').value.trim(),
      website: el<HTMLInputElement>('website').value.trim(),
      email: el<HTMLInputElement>('email').value.trim(),
      country: countryValue.value,
      category_slugs: [
        ...document.querySelectorAll<HTMLInputElement>(
          '[name="category_slugs"]:checked'
        ),
      ].map(i => i.value),
      description_en: el<HTMLTextAreaElement>('description_en').value.trim(),
      description_de:
        el<HTMLTextAreaElement>('description_de').value.trim() || null,
      city: el<HTMLInputElement>('city').value.trim() || null,
      region: el<HTMLInputElement>('region').value.trim() || null,
      phone: el<HTMLInputElement>('phone').value.trim() || null,
      linkedin_url: el<HTMLInputElement>('linkedin_url').value.trim() || null,
      technology_slugs: [
        ...document.querySelectorAll<HTMLInputElement>(
          '[name="technology_slugs"]:checked'
        ),
      ].map(i => i.value),
      industry_slugs: [
        ...document.querySelectorAll<HTMLInputElement>(
          '[name="industry_slugs"]:checked'
        ),
      ].map(i => i.value),
      certification_slugs: [
        ...document.querySelectorAll<HTMLInputElement>(
          '[name="certification_slugs"]:checked'
        ),
      ].map(i => i.value),
      languages: [
        ...document.querySelectorAll<HTMLInputElement>(
          '[name="languages"]:checked'
        ),
      ].map(i => i.value),
      countries_served:
        el<HTMLInputElement>('countries_served').value.trim() || null,
      year_founded: yearVal ? parseInt(yearVal, 10) : null,
      employee_count: el<HTMLSelectElement>('employee_count').value || null,
      taking_new_projects:
        tnpVal === 'true' ? true : tnpVal === 'false' ? false : null,
      is_suspect: isSuspect,
    };
  }

  const form = el<HTMLFormElement>('submit-form');
  const submitBtn = el<HTMLButtonElement>('submit-btn');
  const successEl = el<HTMLElement>('success-state');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearAllErrors();

    if (!validateForm()) {
      showBanner(strings.validateBanner);
      return;
    }

    const honeypotVal = form.querySelector<HTMLInputElement>(
      '[name="website_url"]'
    )?.value;
    const isSuspect = Boolean(honeypotVal);

    submitBtn.disabled = true;
    submitBtn.textContent = strings.submitSubmitting;

    try {
      const res = await fetch('/api/submit-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectPayload(isSuspect)),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok || data.error) {
        showBanner(data.error || strings.errorGeneric);
        submitBtn.disabled = false;
        submitBtn.textContent = strings.submitButton;
      } else {
        form.classList.add('hidden');
        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch {
      showBanner(strings.errorNetwork);
      submitBtn.disabled = false;
      submitBtn.textContent = strings.submitButton;
    }
  });
}
