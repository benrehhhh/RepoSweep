import { daysBetween } from './format.js';

/**
 * Activity classification based purely on GitHub metadata.
 *
 * This is an *indicator*, never a recommendation. A repository that hasn't
 * been touched in years may still be exactly where its owner wants it.
 */

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'potentially-inactive',
  STALE: 'long-inactive',
  ARCHIVED: 'archived',
};

export const ACTIVE_WINDOW_DAYS = 90;
export const INACTIVE_WINDOW_DAYS = 365;
const ACTIVITY_WINDOW_DAYS = 90; // used for dashboard "recently updated"

export function classifyRepo(repo) {
  if (repo.archived !== undefined && repo.archived) {
    return {
      key: STATUS.ARCHIVED,
      label: 'Archived',
      icon: 'bi-archive',
      note: 'Archived on GitHub. Read-only.',
      tone: 'status-archived',
    };
  }

  const pushed = daysBetween(repo.pushed_at || repo.updated_at);
  if (pushed === null) {
    return {
      key: STATUS.ACTIVE,
      label: 'Active',
      icon: 'bi-lightning-charge-fill',
      note: 'Activity status unknown.',
      tone: 'status-unknown',
    };
  }

  if (pushed <= ACTIVE_WINDOW_DAYS) {
    return {
      key: STATUS.ACTIVE,
      label: 'Active',
      icon: 'bi-lightning-charge-fill',
      note: `Updated ${pushed <= 1 ? 'recently' : `${pushed} days ago`}. Active in the last 90 days.`,
      tone: 'status-active',
    };
  }

  if (pushed <= INACTIVE_WINDOW_DAYS) {
    return {
      key: STATUS.INACTIVE,
      label: 'Potentially inactive',
      icon: 'bi-exclamation-triangle-fill',
      note: `No update for ${Math.floor(pushed / 30)} months. Review it before taking action.`,
      tone: 'status-inactive',
    };
  }

  return {
    key: STATUS.STALE,
    label: 'No recent activity',
    icon: 'bi-moon-stars-fill',
    note: `No update for more than a year. This may still be intentional — review before acting.`,
    tone: 'status-stale',
  };
}

export function isRecentlyActive(repo) {
  const days = daysBetween(repo.pushed_at || repo.updated_at);
  return days !== null && days <= ACTIVITY_WINDOW_DAYS;
}