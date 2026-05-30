import {
  deriveWorldwideState,
  isWorldwideCountrySelection,
} from '../../lib/admin/worldwideCountries';

export function initCountriesServedWorldwide(
  section: HTMLElement,
  allCountrySlugs: string[]
): void {
  const worldwideCb = section.querySelector<HTMLInputElement>('#countries-served-worldwide');
  const countryCheckboxes = Array.from(
    section.querySelectorAll<HTMLInputElement>('.country-served-cb')
  );
  if (!worldwideCb || countryCheckboxes.length === 0) return;

  const allSlugs = allCountrySlugs.filter(Boolean);

  function setCountryCheckboxes(checked: boolean, disabled: boolean) {
    for (const cb of countryCheckboxes) {
      cb.checked = checked;
      cb.disabled = disabled;
    }
  }

  function syncWorldwideFromCountries() {
    const selected = countryCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
    worldwideCb.checked = isWorldwideCountrySelection(selected, allSlugs);
    worldwideCb.indeterminate = false;
  }

  function applyWorldwideChecked(checked: boolean) {
    if (checked) {
      setCountryCheckboxes(true, true);
      worldwideCb.checked = true;
    } else {
      setCountryCheckboxes(false, false);
      worldwideCb.checked = false;
    }
  }

  worldwideCb.addEventListener('change', () => {
    applyWorldwideChecked(worldwideCb.checked);
    section.dispatchEvent(new CustomEvent('countries-served-changed'));
  });

  for (const cb of countryCheckboxes) {
    cb.addEventListener('change', () => {
      if (worldwideCb.checked && !cb.checked) {
        worldwideCb.checked = false;
        setCountryCheckboxes(false, false);
      } else if (!worldwideCb.checked) {
        syncWorldwideFromCountries();
        if (worldwideCb.checked) {
          setCountryCheckboxes(true, true);
        }
      }
      section.dispatchEvent(new CustomEvent('countries-served-changed'));
    });
  }

  const initialSelected = countryCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
  const { worldwide } = deriveWorldwideState(initialSelected, allSlugs);
  if (worldwide) {
    applyWorldwideChecked(true);
  } else {
    syncWorldwideFromCountries();
  }
}
