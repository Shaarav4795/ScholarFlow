import clsx, { type ClassValue } from 'clsx';
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns';
import type {
  Assignment,
  AssignmentStatus,
  Priority,
} from '@/types';

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function createId(prefix = 'sf') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDateLabel(date: string, pattern = 'EEE, d MMM') {
  return format(parseISO(date), pattern);
}

export function getDaysUntil(date: string) {
  return differenceInCalendarDays(parseISO(date), new Date());
}

export function getRelativeLabel(date: string) {
  const parsed = parseISO(date);

  if (isSameDay(parsed, new Date())) {
    return 'Today';
  }

  if (differenceInCalendarDays(parsed, new Date()) === 1) {
    return 'Tomorrow';
  }

  if (differenceInCalendarDays(parsed, new Date()) === -1) {
    return 'Yesterday';
  }

  return formatDistanceToNowStrict(parsed, { addSuffix: true });
}

export function isDueToday(date: string) {
  return isSameDay(parseISO(date), new Date());
}

export function isOverdue(date: string) {
  return isBefore(parseISO(date), new Date()) && !isDueToday(date);
}

export function isUpcomingSoon(date: string) {
  return isAfter(parseISO(date), new Date()) && getDaysUntil(date) <= 7;
}

export function getAssignmentProgress(assignment: Assignment) {
  if (assignment.checkpoints.length === 0) {
    return assignment.status === 'completed' ? 100 : 0;
  }

  const completed = assignment.checkpoints.filter((checkpoint) => checkpoint.completed).length;
  return Math.round((completed / assignment.checkpoints.length) * 100);
}

export function getPriorityMeta(priority: Priority) {
  switch (priority) {
    case 'high':
      return {
        label: 'High',
        dot: 'bg-coral-500',
        pill: 'bg-coral-500/15 text-coral-600 ring-coral-500/25 dark:text-coral-400',
      };
    case 'medium':
      return {
        label: 'Medium',
        dot: 'bg-gold-400',
        pill: 'bg-gold-300/18 text-ink-700 ring-gold-400/30 dark:text-gold-300',
      };
    default:
      return {
        label: 'Low',
        dot: 'bg-sage-500',
        pill: 'bg-sage-500/15 text-sage-700 ring-sage-500/25 dark:text-sage-300',
      };
  }
}

export function getStatusMeta(status: AssignmentStatus) {
  switch (status) {
    case 'in_progress':
      return {
        label: 'In Progress',
        pill: 'bg-sky-400/15 text-sky-400 ring-sky-400/20',
      };
    case 'reviewing':
      return {
        label: 'Reviewing',
        pill: 'bg-gold-300/18 text-ink-700 ring-gold-400/30 dark:text-gold-300',
      };
    case 'completed':
      return {
        label: 'Completed',
        pill: 'bg-sage-500/15 text-sage-700 ring-sage-500/25 dark:text-sage-300',
      };
    default:
      return {
        label: 'Not Started',
        pill: 'bg-ink-300/20 text-ink-600 ring-ink-300/25 dark:text-ink-100',
      };
  }
}

export function sortByDueDate<T extends { dueDate: string }>(items: T[]) {
  return [...items].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export function getCompletionDates(assignments: Assignment[]) {
  return assignments.flatMap((assignment) => {
    const checkpointDates = assignment.checkpoints
      .filter((checkpoint) => checkpoint.completedAt)
      .map((checkpoint) => checkpoint.completedAt!.slice(0, 10));

    const assignmentDate = assignment.completedAt ? [assignment.completedAt.slice(0, 10)] : [];
    return [...checkpointDates, ...assignmentDate];
  });
}

export function getStreak(assignments: Assignment[]) {
  const uniqueDates = [...new Set(getCompletionDates(assignments))].sort().reverse();

  if (uniqueDates.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();

  for (const date of uniqueDates) {
    const parsed = parseISO(date);
    const gap = differenceInCalendarDays(cursor, parsed);

    if (streak === 0 && gap > 1) {
      return 0;
    }

    if (gap <= 1) {
      streak += 1;
      cursor = parsed;
      continue;
    }

    break;
  }

  return streak;
}
