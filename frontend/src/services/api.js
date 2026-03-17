const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const authService = {
  register: (data) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  me: () =>
    fetch(`${API_URL}/auth/me`, { headers: getHeaders() }).then(handleResponse),

  refreshStreamKey: () =>
    fetch(`${API_URL}/auth/refresh-stream-key`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),
};

export const streamService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/streams?${qs}`).then(handleResponse);
  },

  get: (id) => fetch(`${API_URL}/streams/${id}`).then(handleResponse),

  start: (data) =>
    fetch(`${API_URL}/streams`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_URL}/streams/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  end: (id) =>
    fetch(`${API_URL}/streams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  getInfo: (id) =>
    fetch(`${API_URL}/streams/${id}/info`, { headers: getHeaders() }).then(handleResponse),
};

export const mixService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/mixes?${qs}`).then(handleResponse);
  },

  feed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/mixes/feed?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  get: (id) => fetch(`${API_URL}/mixes/${id}`).then(handleResponse),

  create: (data) =>
    fetch(`${API_URL}/mixes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_URL}/mixes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_URL}/mixes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  getComments: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/mixes/${id}/comments?${qs}`).then(handleResponse);
  },

  addComment: (id, data) =>
    fetch(`${API_URL}/mixes/${id}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const socialService = {
  follow: (userId) =>
    fetch(`${API_URL}/social/follow/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  unfollow: (userId) =>
    fetch(`${API_URL}/social/follow/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  like: (targetType, targetId) =>
    fetch(`${API_URL}/social/like/${targetType}/${targetId}`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  unlike: (targetType, targetId) =>
    fetch(`${API_URL}/social/like/${targetType}/${targetId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  getStatus: (userId) =>
    fetch(`${API_URL}/social/status/${userId}`, { headers: getHeaders() }).then(handleResponse),

  getFollowers: (userId) =>
    fetch(`${API_URL}/social/followers/${userId}`).then(handleResponse),

  getFollowing: (userId) =>
    fetch(`${API_URL}/social/following/${userId}`).then(handleResponse),
};

export const userService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/users?${qs}`).then(handleResponse);
  },

  getByUsername: (username) =>
    fetch(`${API_URL}/users/${username}`).then(handleResponse),

  getUserMixes: (username, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/users/${username}/mixes?${qs}`).then(handleResponse);
  },

  getUserStreams: (username, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/users/${username}/streams?${qs}`).then(handleResponse);
  },

  updateProfile: (data) =>
    fetch(`${API_URL}/users/me/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};
