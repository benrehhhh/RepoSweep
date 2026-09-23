"""Mock GitHub data source used when real OAuth credentials are not configured.

This module mirrors the GitHubClient interface so that swapping demo mode for
real GitHub integration is a configuration-only change. Every repository here
is synthetic demo data and is explicitly flagged as such by the API layer.
"""

from datetime import datetime, timedelta, timezone


def _now():
    return datetime.now(timezone.utc)


def _ts(days_ago, hours_ago=0):
    return (_now() - timedelta(days=days_ago, hours=hours_ago)).isoformat()


def _repo(
    id,
    name,
    description,
    private=False,
    language=None,
    stars=0,
    forks=0,
    size_kb=48,
    archived=False,
    fork=False,
    days_since_push=None,
    days_since_create=None,
    default_branch="main",
    open_issues=0,
    homepage=None,
):
    days_since_push = days_since_push if days_since_push is not None else days_since_create or 30
    days_since_create = days_since_create if days_since_create is not None else days_since_push
    return {
        "id": id,
        "node_id": f"demo_repo_{id}",
        "name": name,
        "full_name": f"demo-user/{name}",
        "owner": {
            "login": "demo-user",
            "id": 9000001,
            "avatar_url": "https://api.dicebear.com/9.x/identicon/svg?seed=reposweep-demo"
            "&backgroundColor=24292f",
            "html_url": "https://github.com/demo-user",
        },
        "private": private,
        "html_url": f"https://github.com/demo-user/{name}",
        "description": description,
        "fork": fork,
        "url": f"https://api.github.com/repos/demo-user/{name}",
        "created_at": _ts(days_since_create, 2),
        "updated_at": _ts(days_since_push, 1),
        "pushed_at": _ts(days_since_push),
        "default_branch": default_branch,
        "language": language,
        "stargazers_count": stars,
        "forks_count": forks,
        "size": size_kb,
        "open_issues_count": open_issues,
        "archived": archived,
        "homepage": homepage,
        "_source": "demo",
    }


BLUEPRINTS = [
    # id, name, desc, private, lang, stars, forks, push_days, create_days, archived, flags...
    _repo(1, "StudyLens-AI", "Web app for turning lecture transcripts into searchable flashcards.",
          private=True, language="TypeScript", stars=42, forks=9, size_kb=1240,
          days_since_push=2, days_since_create=620, open_issues=3),
    _repo(2, "old-school-project", "Final year university project: a PHP bulletin board system.",
          private=False, language="PHP", stars=3, forks=1, size_kb=812,
          days_since_push=740, days_since_create=1650, open_issues=0),
    _repo(3, "test-api", "Throwaway FastAPI playground for exploring websockets.",
          private=True, language="Python", stars=0, forks=0, size_kb=96,
          days_since_push=430, days_since_create=445),
    _repo(4, "portfolio", "Personal portfolio site. Jekyll based, no build step.", private=False,
          language="HTML", stars=11, forks=2, size_kb=340,
          days_since_push=91, days_since_create=980, homepage="https://veyvin.dev"),
    _repo(5, "experiment-2023", "CLI experiment mashing up Go and SQLite for a todo tracker.",
          private=True, language="Go", stars=1, forks=0, size_kb=210,
          days_since_push=560, days_since_create=565),
    _repo(6, "old-portfolio-v2", "Previous portfolio attempt before the static one.", private=False,
          language="JavaScript", stars=2, forks=0, size_kb=260,
          days_since_push=700, days_since_create=1120, archived=True),
    _repo(7, "unused-demo", "Pre-built template project for conference demo, never shipped.",
          private=False, language="JavaScript", stars=0, forks=0, size_kb=150,
          days_since_push=610, days_since_create=614),
    _repo(8, "dotfiles", "Personal dotfiles and shell setup scripts.", private=True, language="Shell",
          stars=19, forks=5, size_kb=64, days_since_push=14, days_since_create=1500),
    _repo(9, "git-hooks-utils", "Collection of reusable git hooks for teams.", private=False,
          language="Shell", stars=27, forks=6, size_kb=88,
          days_since_push=60, days_since_create=500),
    _repo(10, "weather-cli", "Command line weather app using Open-Meteo.", private=False,
          language="Rust", stars=54, forks=8, size_kb=320,
          days_since_push=5, days_since_create=320),
    _repo(11, "screenshot-service", "Microservice that renders HTML to PNG at scale.", private=True,
          language="TypeScript", stars=0, forks=1, size_kb=450,
          days_since_push=35, days_since_create=420),
    _repo(12, "hackathon-foodfinder", "24-hour hackathon project: campus food truck map.",
          private=False, language="Python", stars=8, forks=3, size_kb=140,
          days_since_push=890, days_since_create=891),
    _repo(13, "csv-to-json", "Quick utility to convert CSVs to JSON, published as a gist first.",
          private=False, language="Python", stars=6, forks=2, size_kb=38,
          days_since_push=1200, days_since_create=1210),
    _repo(14, "blog-articles", "Markdown source for my technical blog.", private=True,
          language=None, stars=0, forks=0, size_kb=900,
          days_since_push=18, days_since_create=800),
    _repo(15, "esp32-sensor-station", "Home IoT sensor station firmware.", private=True,
          language="C++", stars=4, forks=2, size_kb=260,
          days_since_push=220, days_since_create=380),
    _repo(16, "leetcode-grind", "Solutions plus notes for your typical DSA grind.", private=False,
          language="Python", stars=13, forks=4, size_kb=200,
          days_since_push=130, days_since_create=640),
    _repo(17, "containerized-django", "Reference Django docker-compose stack.", private=False,
          language="Python", stars=88, forks=31, size_kb=180,
          days_since_push=40, days_since_create=950),
    _repo(18, "procrastination-tracker", "App that nags you about your side projects.", private=True,
          language="JavaScript", stars=0, forks=0, size_kb=120,
          days_since_push=5, days_since_create=90),
    _repo(19, "config-backup", "One-off script to back up router configs.", private=True,
          language="Shell", stars=0, forks=0, size_kb=22,
          days_since_push=390, days_since_create=395, archived=True),
    _repo(20, "mock-auth-server", "Stub OAuth2 server for frontend testing.", private=False,
          language="Node", stars=31, forks=9, size_kb=160,
          days_since_push=75, days_since_create=720),
    _repo(21, "parser-hell", "Attempted markdown parser in three weeks. It works. Barely.",
          private=False, language="TypeScript", stars=2, forks=1, size_kb=95,
          days_since_push=300, days_since_create=301),
    _repo(22, "advent2024", "Advent of Code 2024 solutions.", private=False, language="Python",
          stars=16, forks=3, size_kb=120, days_since_push=420, days_since_create=425),
    _repo(23, "homepage-probe", "Uptime probe for my personal services.", private=True,
          language="Go", stars=0, forks=0, size_kb=64,
          days_since_push=55, days_since_create=210),
    _repo(24, "deploy-scripts", "Old deploy scripts for a long-gone VPS.", private=False,
          language="Shell", stars=1, forks=0, size_kb=80,
          days_since_push=1500, days_since_create=1550, archived=True),
    _repo(25, "react-table-proto", "Prototype for a virtualized data grid.", private=True,
          language="TypeScript", stars=0, forks=0, size_kb=220,
          days_since_push=500, days_since_create=505),
    _repo(26, "cursor-rules", "Shared editor rules and snippets.", private=False, language=None,
          stars=24, forks=7, size_kb=140, days_since_push=28, days_since_create=180),
    _repo(27, "chrome-extension-boilerplate", "Vite + WXT starter for extensions.", private=False,
          language="TypeScript", stars=64, forks=11, size_kb=150,
          days_since_push=12, days_since_create=300),
    _repo(28, "notes-sync", "Obsidian vault sync helper.", private=False, language="Rust",
          stars=9, forks=2, size_kb=120, days_since_push=80, days_since_create=330),
    _repo(29, "image-opt-bench", "Benchmark of image optimization libs.", private=True,
          language="JavaScript", stars=0, forks=0, size_kb=700,
          days_since_push=280, days_since_create=810, archived=True),
    _repo(30, "build-tool-spike", "Spike comparing bundlers for the docs site.", private=True,
          language="JavaScript", stars=0, forks=0, size_kb=160,
          days_since_push=600, days_since_create=601),
    _repo(31, "latex-thesis-2021", "My master's thesis TeX sources.", private=False,
          language="TeX", stars=5, forks=1, size_kb=5800,
          days_since_push=1540, days_since_create=1620, archived=True),
    _repo(32, "flask-demo-api", "Tutorial API used in my Flask guide.", private=False,
          language="Python", stars=47, forks=22, size_kb=110,
          days_since_push=200, days_since_create=1100),
    _repo(33, "font-subsetter", "Subset woff2 fonts for the web.", private=True,
          language="Python", stars=0, forks=0, size_kb=210,
          days_since_push=140, days_since_create=450),
    _repo(34, "weird-scripts", "Catch-all for scripts that did one job once.", private=False,
          language="Python", stars=3, forks=1, size_kb=90,
          days_since_push=360, days_since_create=1300),
    _repo(35, "theme-switcher", "Light/dark theme switcher demo component.", private=False,
          language="TypeScript", stars=12, forks=3, size_kb=60,
          days_since_push=45, days_since_create=200),
    _repo(36, "dockerfiles", "Reusable Dockerfiles I keep in sync.", private=False,
          language="Dockerfile", stars=22, forks=7, size_kb=70,
          days_since_push=66, days_since_create=870),
    _repo(37, "db-migration-lab", "Experimenting with zero-downtime migrations.", private=True,
          language="SQL", stars=0, forks=0, size_kb=240,
          days_since_push=250, days_since_create=260),
    _repo(38, "jquery-legacy-widget", "Widget from a client project, definitely EOL.", private=True,
          language="JavaScript", stars=0, forks=0, size_kb=300,
          days_since_push=1640, days_since_create=1700, archived=True),
    _repo(39, "blender-add-on", "Small Blender add-on for hard-surface painting.", private=False,
          language="Python", stars=37, forks=6, size_kb=340,
          days_since_push=90, days_since_create=700),
    _repo(40, "cicd-poc", "Proof of concept for the team's CI/CD overhaul.", private=False,
          language="YAML", stars=6, forks=2, size_kb=130,
          days_since_push=102, days_since_create=400),
    _repo(41, "old-blog-static", "Old static blog generator experiment.", private=False,
          language="JavaScript", stars=2, forks=0, size_kb=180,
          days_since_push=980, days_since_create=1400, archived=True),
    _repo(42, "gen-art", "Generative art playground.", private=False, language="JavaScript",
          stars=29, forks=8, size_kb=260, days_since_push=30, days_since_create=560),
    _repo(43, "redis-lua-patterns", "Notes and scripts for Redis Lua.", private=False,
          language="Lua", stars=18, forks=5, size_kb=60,
          days_since_push=150, days_since_create=650),
    _repo(44, "honeypot-tracker", "Track scanner hits on a small honeypot.", private=True,
          language="Python", stars=3, forks=1, size_kb=140,
          days_since_push=190, days_since_create=460),
    _repo(45, "site-audit-tool", "Lighthouse based audit for a dozen sites.", private=False,
          language="JavaScript", stars=7, forks=2, size_kb=200,
          days_since_push=110, days_since_create=480),
]

# A couple of examples the spec explicitly references
BLUEPRINTS += [
    _repo(46, "old-school-project-archive", "Read-only snapshot of a deprecated school project.",
          private=True, language="Java", stars=0, forks=0, size_kb=620,
          days_since_push=1330, days_since_create=1331, archived=True),
    _repo(47, "api-rate-limiter-example", "Reference rate limiting middleware examples.",
          private=False, language="Python", stars=15, forks=4, size_kb=92,
          days_since_push=70, days_since_create=730),
]

REPOSITORIES = BLUEPRINTS


def get_repos(username=None, access_token=None):
    return [dict(repo) for repo in REPOSITORIES]


def get_repo(owner, name, access_token=None):
    for repo in REPOSITORIES:
        if repo["owner"]["login"] == owner and repo["name"] == name:
            return dict(repo)
    return None


def archive_repo(owner, name, access_token=None):
    for repo in REPOSITORIES:
        if repo["owner"]["login"] == owner and repo["name"] == name:
            repo["archived"] = True
            return dict(repo)
    raise MockError(f"Repository {owner}/{name} not found", 404)


def delete_repo(owner, name, access_token=None):
    repo = get_repo(owner, name)
    if repo is None:
        raise MockError(f"Repository {owner}/{name} not found", 404)
    REPOSITORIES[:] = [r for r in REPOSITORIES if not (r["name"] == name and r["owner"]["login"] == owner)]
    return True


def get_user(access_token=None):
    return {
        "id": 9000001,
        "login": "demo-user",
        "name": "Demo User",
        "avatar_url": "https://api.dicebear.com/9.x/identicon/svg?seed=reposweep-demo"
        "&backgroundColor=24292f",
    }


def reset():
    """Restore the original mock repository list (used between demo runs)."""
    global REPOSITORIES
    REPOSITORIES = list(BLUEPRINTS)


class MockError(Exception):
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code