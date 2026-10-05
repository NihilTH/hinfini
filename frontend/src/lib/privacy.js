export const PRIVACY_KEY = 'hi_privacy_v1';
export function privacyChoice() {
  try { const v=JSON.parse(localStorage.getItem(PRIVACY_KEY)); return v && typeof v.optional==='boolean' && v.expires>Date.now() ? v : null; } catch { return null; }
}
export function savePrivacy(optional) {
  const value={optional,expires:Date.now()+180*86400000};
  try { localStorage.setItem(PRIVACY_KEY,JSON.stringify(value)); } catch { /* denied storage: choice applies to this page only */ }
  window.dispatchEvent(new CustomEvent('privacy-choice',{detail:value}));
  if(!optional && window.barion_pixel_id) window.location.reload();
}
