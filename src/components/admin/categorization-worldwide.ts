import { deriveWorldwideState } from '../../lib/admin/worldwideCountries';

export function initCountriesServedWorldwide(section: HTMLElement): void {
  const worldwideCb = section.querySelector<HTMLInputElement>('#countries-served-worldwide');
  const countryCheckboxes = Array.from(
    section.querySelectorAll<HTMLInputElement>('.country-served-cb')
  );
  if (!worldwideCb || countryCheckboxes.length === 0) return;

  function setCountryInputsDisabled(disabled: boolean) {
    for (const cb of countryCheckboxes) {
      cb.disabled = disabled;
    }
  }

  /** Worldwide = one flag only; individual country boxes stay unchecked. */
  function applyWorldwideChecked(checked: boolean) {
    if (checked) {
      for (const cb of countryCheckboxes) {
        cb.checked = false;
        cb.disabled = true;
      }
      worldwideCb.checked = true;
    } else {
      setCountryInputsDisabled(false);
      worldwideCb.checked = false;
    }
  }

  worldwideCb.addEventListener('change', () => {
    applyWorldwideChecked(worldwideCb.checked);
    section.dispatchEvent(new CustomEvent('countries-served-changed'));
  });

  for (const cb of countryCheckboxes) {
    cb.addEventListener('change', () => {
      if (worldwideCb.checked) {
        worldwideCb.checked = false;
        setCountryInputsDisabled(false);
      }
      section.dispatchEvent(new CustomEvent('countries-served-changed'));
    });
  }

  if (worldwideCb.checked) {
    applyWorldwideChecked(true);
  }
}
