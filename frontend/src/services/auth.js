import { http } from '../api/http.js';

export async function authStatus() {
  return http.get('/auth/status');
}

export async function demoLogin() {
  return http.post('/auth/demo', {});
}

export async function logout() {
  return http.post('/auth/logout', {});
}

export function githubAuthorizeUrl() {
  return `${window.location.origin}/api/auth/github`;
}