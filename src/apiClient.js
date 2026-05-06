const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function apiFetch(path, options) {
  const url = `${API_BASE_URL}${path}`
  return fetch(url, options)
}


