// Where the login tokens live in the browser. The access token is short-lived (15 minutes);
// the refresh token lasts about a month and is only sent to /auth/refresh.
const ACCESS = 'access_token'
const REFRESH = 'refresh_token'

export const tokens = {
  access: () => localStorage.getItem(ACCESS),
  refresh: () => localStorage.getItem(REFRESH),
  save({ access_token: access, refresh_token: refresh }) {
    if (access) localStorage.setItem(ACCESS, access)
    if (refresh) localStorage.setItem(REFRESH, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
  },
}
