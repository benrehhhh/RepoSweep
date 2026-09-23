"""Service layer that switches between real GitHub and demo mode.

Both backends expose the same method signatures, so enabling real GitHub
integration is purely a configuration change (setting GITHUB_CLIENT_ID and
GITHUB_CLIENT_SECRET).
"""

from flask import current_app

from app import mock_github
from app.github import GitHubClient
from app.utils.errors import GitHubAPIError


def is_mock_mode():
    return current_app.config["MOCK_MODE"]


def _client(access_token=None):
    if access_token and not is_mock_mode():
        return GitHubClient(access_token)
    return None


def get_user(access_token=None):
    client = _client(access_token)
    if client:
        return client.get_user()
    return mock_github.get_user(access_token)


def get_repos(access_token=None):
    client = _client(access_token)
    if client:
        return client.get_repos()
    return mock_github.get_repos(access_token)


def get_repo(owner, name, access_token=None):
    client = _client(access_token)
    if client:
        return client.get_repo(owner, name)
    return mock_github.get_repo(owner, name)


def archive_repo(owner, name, access_token=None):
    client = _client(access_token)
    if client:
        return client.archive_repo(owner, name)
    return mock_github.archive_repo(owner, name)


def delete_repo(owner, name, access_token=None):
    client = _client(access_token)
    if client:
        return client.delete_repo(owner, name)
    return mock_github.delete_repo(owner, name)


def current_snapshot(access_token=None):
    """The list of repositories the user can currently reach, as a lookup map.

    Used to verify ownership before destructive operations. The frontend is
    never trusted; every target must exist in this snapshot.
    """
    repos = get_repos(access_token) or []
    lookup = {}
    for repo in repos:
        full_name = repo.get("full_name") or f"{repo['owner']['login']}/{repo['name']}"
        lookup[full_name.lower()] = repo
    return lookup