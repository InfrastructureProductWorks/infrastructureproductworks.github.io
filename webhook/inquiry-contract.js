// Canonical bounded portfolio inquiry values. The build/check script keeps HTML in sync.
export const PRODUCTS = Object.freeze(['Storefront','IaaP Guard','IaaP Forge','IaaP Console','IaaP Assurance','Crossplane','Website','General']);
export const TYPES = Object.freeze(['Portfolio question','Public demo issue','Documentation','Evidence question','Feedback','Other']);
// Compatibility for older callers; these labels never expand operational authority.
const LEGACY = Object.freeze({'Product question':'Portfolio question','Bug':'Public demo issue','Feature request':'Feedback'});
export function inquiryType(value) {
  if (TYPES.includes(value)) return value;
  return Object.hasOwn(LEGACY, value) ? LEGACY[value] : null;
}
