/** English canonical names (API / stored value). */
export const ISO_COUNTRIES_EN = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium",
  "Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria","Cambodia","Canada",
  "Chile","China","Colombia","Costa Rica","Croatia","Cyprus","Czech Republic",
  "Denmark","Ecuador","Egypt","Estonia","Ethiopia","Finland","France","Georgia",
  "Germany","Ghana","Greece","Hong Kong","Hungary","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia","Mexico",
  "Morocco","Netherlands","New Zealand","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Saudi Arabia","Serbia","Singapore","Slovakia","Slovenia",
  "South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland",
  "Taiwan","Thailand","Tunisia","Turkey","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam",
  "Zimbabwe"
] as const;

/** German labels for DE locale UI (paired by index with ISO_COUNTRIES_EN). */
export const ISO_COUNTRIES_DE = [
  "Afghanistan","Albanien","Algerien","Andorra","Angola","Argentinien","Armenien",
  "Australien","Österreich","Aserbaidschan","Bahrain","Bangladesch","Belarus","Belgien",
  "Bolivien","Bosnien und Herzegowina","Brasilien","Bulgarien","Kambodscha","Kanada",
  "Chile","China","Kolumbien","Costa Rica","Kroatien","Zypern","Tschechien",
  "Dänemark","Ecuador","Ägypten","Estland","Äthiopien","Finnland","Frankreich","Georgien",
  "Deutschland","Ghana","Griechenland","Hongkong","Ungarn","Indien","Indonesien","Iran",
  "Irak","Irland","Israel","Italien","Japan","Jordanien","Kasachstan","Kenia",
  "Kuwait","Lettland","Libanon","Litauen","Luxemburg","Malaysia","Mexiko",
  "Marokko","Niederlande","Neuseeland","Nigeria","Nordmazedonien","Norwegen",
  "Oman","Pakistan","Peru","Philippinen","Polen","Portugal","Katar","Rumänien",
  "Russland","Saudi-Arabien","Serbien","Singapur","Slowakei","Slowenien",
  "Südafrika","Südkorea","Spanien","Sri Lanka","Schweden","Schweiz",
  "Taiwan","Thailand","Tunesien","Türkei","Ukraine","Vereinigte Arabische Emirate",
  "Vereinigtes Königreich","Vereinigte Staaten","Uruguay","Usbekistan","Venezuela","Vietnam",
  "Simbabwe"
] as const;

export const COUNTRY_PAIRS = ISO_COUNTRIES_EN.map((en, i) => ({
  en,
  de: ISO_COUNTRIES_DE[i]!,
}));
