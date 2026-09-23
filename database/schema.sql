-- RepoSweep database schema (MySQL 8.0+)
-- Run after creating the database and dedicated user. See README.

USE reposweep;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    github_id BIGINT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    github_access_token TEXT NULL,
    token_scope VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    KEY idx_users_github_id (github_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS protected_repositories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    github_repo_id BIGINT NULL,
    owner VARCHAR(255) NOT NULL,
    repository_name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_owner_repo (user_id, owner, repository_name),
    CONSTRAINT fk_protected_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(32) NOT NULL,
    -- actions: delete | archive | protect | unprotect
    repository_count INT NOT NULL DEFAULT 0,
    -- status: success | partial | failed
    status VARCHAR(16) NOT NULL DEFAULT 'success',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_user (user_id, created_at),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operation_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_log_id BIGINT UNSIGNED NOT NULL,
    owner VARCHAR(255) NOT NULL,
    repository_name VARCHAR(255) NOT NULL,
    -- status: success | failed | skipped
    status VARCHAR(16) NOT NULL DEFAULT 'success',
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_opitems_log (activity_log_id),
    CONSTRAINT fk_opitems_log FOREIGN KEY (activity_log_id)
        REFERENCES activity_logs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;