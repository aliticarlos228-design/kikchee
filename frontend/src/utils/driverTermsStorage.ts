const STORAGE_KEY = 'kikchee_driver_terms_accepted';
const LEGACY_STORAGE_KEY = 'logiflow_driver_terms_accepted';

export function hasAcceptedDriverTerms(): boolean {
  return (
    localStorage.getItem(STORAGE_KEY) === '1' ||
    localStorage.getItem(LEGACY_STORAGE_KEY) === '1'
  );
}

export function markDriverTermsAccepted(): void {
  localStorage.setItem(STORAGE_KEY, '1');
}
