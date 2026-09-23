import { http } from '../api/http.js';

export async function getRepositories() {
  return http.get('/repositories');
}

export async function bulkArchive(repositories) {
  return http.post('/repositories/bulk/archive', { repositories });
}

export async function bulkDelete(repositories, confirmPhrase) {
  return http.post('/repositories/bulk/delete', {
    repositories,
    confirm_phrase: confirmPhrase,
  });
}

export async function getUser() {
  return http.get('/user');
}