export const SESSION_HOURS = Number(import.meta.env.VITE_SESSION_HOURS) || 24;

export const setCookie = (name, value, hours = SESSION_HOURS) => {
  if (typeof document === 'undefined') return;
  const maxAge = hours * 60 * 60; // hours in seconds
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; expires=${expires}; SameSite=Lax`;
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

export const clearAllAuthCookies = () => {
  const superAdminCookieNames = [
    '_super_x_tkn',
    '_super_r_tkn',
    '_admin_sess_time',
  ];
  superAdminCookieNames.forEach((name) => deleteCookie(name));
};
