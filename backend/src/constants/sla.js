import { PRIORITIES } from './priorities.js';

/**
 * Centralized SLA Resolution Targets (in hours).
 *
 * CRITICAL: 2 hours
 * HIGH: 8 hours
 * MEDIUM: 24 hours
 * LOW: 72 hours
 */
export const SLA_TARGETS = Object.freeze({
  [PRIORITIES.CRITICAL]: 2,
  [PRIORITIES.HIGH]: 8,
  [PRIORITIES.MEDIUM]: 24,
  [PRIORITIES.LOW]: 72
});

/**
 * SLA Statuses
 */
export const SLA_STATUS = Object.freeze({
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  OVERDUE: 'OVERDUE',
  RESOLVED_ON_TIME: 'RESOLVED_ON_TIME',
  RESOLVED_LATE: 'RESOLVED_LATE'
});

export const SLA_STATUS_LIST = Object.values(SLA_STATUS);

/**
 * AT_RISK threshold: 20% or less of original SLA duration remaining.
 */
export const SLA_AT_RISK_RATIO = 0.2;
