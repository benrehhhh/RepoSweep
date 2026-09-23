class RepoSweepError(Exception):
    """Base application error carrying an HTTP status code."""

    status_code = 500

    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class AuthError(RepoSweepError):
    """Authentication / authorization problems."""

    def __init__(self, message, status_code=401):
        super().__init__(message, status_code)


class NotFoundError(RepoSweepError):
    def __init__(self, message="Not found", status_code=404):
        super().__init__(message, status_code)


class GitHubAPIError(RepoSweepError):
    """An error raised while talking to the GitHub API.

    `friendly` is shown to end users; the raw GitHub error is never leaked.
    """

    def __init__(self, message, friendly="GitHub couldn't complete this action.", status_code=502):
        super().__init__(message, status_code)
        self.friendly = friendly


def friendly_for_github_status(status_code, method):
    if status_code in (401, 403) and status_code == 403 and "rate" in method.lower():
        return None
    return {
        401: "GitHub authentication expired. Please sign in again.",
        403: "You don't have permission to do that on GitHub.",
        404: "Repository not found, or you no longer have access to it.",
        429: "GitHub rate limit exceeded. Try again in a little while.",
    }.get(status_code, "GitHub couldn't complete this action. Please try again.")