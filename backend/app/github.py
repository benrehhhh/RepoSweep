import requests

from flask import current_app

from app.utils.errors import GitHubAPIError, friendly_for_github_status


class GitHubClient:
    """Wrapper around the GitHub REST API for the authenticated user."""

    def __init__(self, access_token):
        self.access_token = access_token
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"token {self.access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "RepoSweep",
            }
        )

    def _request(self, method, path, **kwargs):
        url = f"{current_app.config['GITHUB_API_URL']}{path}"
        timeout = kwargs.pop("timeout", 30)
        try:
            response = self.session.request(method, url, timeout=timeout, **kwargs)
        except requests.RequestException:
            raise GitHubAPIError(
                "network error",
                friendly="GitHub is unreachable right now. Check your connection and try again.",
            )

        if response.status_code >= 400:
            friendly = friendly_for_github_status(response.status_code, method)
            raise GitHubAPIError(response.text[:500], friendly=friendly, status_code=502)

        if response.status_code == 204 or not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return response.text

    def get_user(self):
        return self._request("GET", "/user")

    def get_repos(self, per_page=100, max_pages=10):
        repos = []
        page = 1
        while page <= max_pages:
            batch = self._request(
                "GET",
                "/user/repos",
                params={"per_page": per_page, "page": page, "sort": "pushed", "type": "all"},
            )
            if not batch:
                break
            repos.extend(batch)
            if len(batch) < per_page:
                break
            page += 1
        return repos

    def get_repo(self, owner, name):
        return self._request("GET", f"/repos/{owner}/{name}")

    def archive_repo(self, owner, name):
        return self._request("PATCH", f"/repos/{owner}/{name}", json={"archived": True})

    def delete_repo(self, owner, name):
        return self._request("DELETE", f"/repos/{owner}/{name}")


class OAuth:
    """GitHub OAuth web-application flow helpers."""

    @staticmethod
    def authorize_url():
        cfg = current_app.config
        params = {
            "client_id": cfg["GITHUB_CLIENT_ID"],
            "redirect_uri": cfg["GITHUB_REDIRECT_URI"],
            "scope": cfg["GITHUB_SCOPES"],
            "allow_signup": "true",
        }
        from urllib.parse import urlencode

        return f"{cfg['GITHUB_OAUTH_URL']}/authorize?{urlencode(params)}"

    @staticmethod
    def exchange_code(code):
        cfg = current_app.config
        payload = {
            "client_id": cfg["GITHUB_CLIENT_ID"],
            "client_secret": cfg["GITHUB_CLIENT_SECRET"],
            "code": code,
            "redirect_uri": cfg["GITHUB_REDIRECT_URI"],
        }
        try:
            response = requests.post(
                f"{cfg['GITHUB_OAUTH_URL']}/access_token",
                json=payload,
                headers={"Accept": "application/json"},
                timeout=30,
            )
        except requests.RequestException:
            raise GitHubAPIError(
                "oauth network error",
                friendly="GitHub is unreachable right now. Please try signing in again.",
            )

        data = response.json() if response.ok else {}
        error = data.get("error")
        if error or "access_token" not in data:
            raise GitHubAPIError(
                f"oauth error: {error or data}",
                friendly="GitHub didn't accept the sign-in. Please try again.",
            )
        return {
            "access_token": data["access_token"],
            "scope": data.get("scope", ""),
            "token_type": data.get("token_type", "bearer"),
        }