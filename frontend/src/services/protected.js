import { http } from '../api/http.js';

export async function listProtected() {
  return http.get('/protected-repositories');
}

export async function addProtected(owner, repositoryName) {
  return http.post('/protected-repositories', {
    owner,
    repository_name: repositoryName,
  });
}

export async function removeProtected(id) {
  return http.del(`/protected-repositories/${id}`);
}

export async function listActivity() {
  return http.get('/activity');
}