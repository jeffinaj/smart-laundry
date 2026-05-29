function getCsrfToken() {
  const name = 'csrftoken='
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length)
    }
  }
  return ''
}

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'X-CSRFToken': getCsrfToken(),
})

export async function apiFetch(path, options = {}) {
  const fetchOptions = {
    credentials: 'include',
    headers: defaultHeaders(),
    ...options,
  }
  if (options.body && typeof options.body !== 'string') {
    fetchOptions.body = JSON.stringify(options.body)
  }
  const response = await fetch(`/api${path}`, fetchOptions)
  return response.json()
}

export async function getCsrfCookie() {
  await fetch('/api/csrf/', { credentials: 'include' })
}
