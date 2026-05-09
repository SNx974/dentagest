const BASE = '/api'

function getToken() {
  return localStorage.getItem('dentagest_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
  return data
}

const api = {
  // Auth
  login:    (email, password) => request('POST', '/auth/login', { email, password }),
  register: (body)            => request('POST', '/auth/register', body),

  // User
  getUser:       ()     => request('GET',  '/user'),
  updateUser:    (body) => request('PUT',  '/user', body),
  updateSettings:(body) => request('PUT',  '/user/settings', body),

  // Cabinets
  getCabinets:    ()        => request('GET',    '/cabinets'),
  createCabinet:  (body)    => request('POST',   '/cabinets', body),
  updateCabinet:  (id, body)=> request('PUT',    `/cabinets/${id}`, body),
  deleteCabinet:  (id)      => request('DELETE', `/cabinets/${id}`),

  // Replacements
  getReplacements:    ()        => request('GET',    '/replacements'),
  createReplacement:  (body)    => request('POST',   '/replacements', body),
  updateReplacement:  (id, body)=> request('PUT',    `/replacements/${id}`, body),
  deleteReplacement:  (id)      => request('DELETE', `/replacements/${id}`),

  // Acts
  getActs:    ()        => request('GET',    '/acts'),
  createAct:  (body)    => request('POST',   '/acts', body),
  updateAct:  (id, body)=> request('PUT',    `/acts/${id}`, body),
  deleteAct:  (id)      => request('DELETE', `/acts/${id}`),
}

export default api
