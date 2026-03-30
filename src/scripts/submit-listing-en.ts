import { initSubmitListing } from './submit-listing-client';
import { ISO_COUNTRIES_EN } from './submit-listing-country-data';

initSubmitListing({
  country: { mode: 'en', countries: ISO_COUNTRIES_EN },
  strings: {
    countryNoResults: 'No results',
    section2Hide: '− Hide extra details',
    section2Show:
      '+ Add more details — the more you provide, the faster your listing goes live',
    validateBanner: 'Please fix the highlighted fields before submitting.',
    submitSubmitting: 'Submitting…',
    submitButton: 'Submit Listing',
    errorGeneric: 'Something went wrong. Please try again.',
    errorNetwork: 'Network error. Please check your connection and try again.',
  },
});
