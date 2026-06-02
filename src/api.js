const BASE = '';

async function req(method, url, body, isForm = false) {
  const opts = {
    method,
    credentials: 'include',
  };
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(BASE + url, opts);
  const data = await res.json();
  if (!res.ok && !data.message) throw new Error('Erreur reseau');
  return data;
}

export const api = {
  getMe: () => req('GET', '/api/me'),
  login: (username, password) => req('POST', '/api/login', { username, password }),
  register: (username, email, password, confirmPassword) => req('POST', '/api/register', { username, email, password, confirmPassword }),
  logout: () => req('POST', '/api/logout'),

  getCategories: () => req('GET', '/api/categories'),

  getPosts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.mine) qs.set('mine', 'true');
    if (params.liked) qs.set('liked', 'true');
    if (params.page) qs.set('page', params.page);
    return req('GET', '/api/posts?' + qs);
  },
  getPost: (id) => req('GET', '/api/posts/' + id),
  createPost: (formData) => req('POST', '/api/posts', formData, true),
  updatePost: (id, title, body) => req('PUT', '/api/posts/' + id, { title, body }),
  deletePost: (id) => req('DELETE', '/api/posts/' + id),

  createComment: (postId, content) => req('POST', '/api/comments', { post_id: postId, content }),
  updateComment: (id, content) => req('PUT', '/api/comments/' + id, { content }),
  deleteComment: (id) => req('DELETE', '/api/comments/' + id),

  vote: (targetId, targetType, type) => req('POST', '/api/like', { target_id: targetId, target_type: targetType, type }),
};
