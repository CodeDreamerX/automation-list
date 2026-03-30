import { initSubmitListing } from './submit-listing-client';
import { COUNTRY_PAIRS } from './submit-listing-country-data';

initSubmitListing({
  country: { mode: 'de', pairs: COUNTRY_PAIRS },
  strings: {
    countryNoResults: 'Keine Ergebnisse',
    section2Hide: '− Details ausblenden',
    section2Show:
      '+ Weitere Details hinzufügen — je mehr Sie angeben, desto schneller wird Ihr Eintrag freigeschaltet',
    validateBanner:
      'Bitte korrigieren Sie die markierten Felder vor dem Absenden.',
    submitSubmitting: 'Wird eingereicht…',
    submitButton: 'Eintrag einreichen',
    errorGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    errorNetwork:
      'Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  },
});
