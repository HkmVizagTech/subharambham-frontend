// export const apiBase = `http://localhost:3300`;
export const apiBase = `https://hkm-subharambham-backend-882278565284.asia-south1.run.app`;

export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token && !headers.Authorization)
    headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  return res;
}

export const api = {
  get: (path, options = {}) => apiFetch(path, { method: 'GET', ...options }),
  post: (path, body, options = {}) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (path, body, options = {}) =>
    apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  del: (path, options = {}) => apiFetch(path, { method: 'DELETE', ...options }),
};
