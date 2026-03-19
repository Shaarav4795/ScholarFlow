import { addDays, differenceInCalendarDays, format, max, parseISO, startOfDay } from 'date-fns';
import type {
  Assignment,
  AssignmentStatus,
  Checkpoint,
  ExtractedAssignment,
  Priority,
} from '@/types';
import { createId } from '@/lib/utils';

const checkpointTemplates = [
  'Decode the brief and success criteria',
  'Gather research and source material',
  'Build the first solid draft',
  'Refine the argument and structure',
  'Proofread, polish, and submit',
];

export interface AssignmentDraft {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status?: AssignmentStatus;
  checkpoints?: Array<Pick<Checkpoint, 'title' | 'dueDate'>>;
  source?: Assignment['source'];
}

export function generateSmartCheckpoints(
  title: string,
  dueDate: string,
  description = '',
  fromDate = format(new Date(), 'yyyy-MM-dd'),
) {
  const today = startOfDay(parseISO(fromDate));
  const deadline = startOfDay(parseISO(dueDate));
  const gap = Math.max(differenceInCalendarDays(deadline, today), 1);
  const steps = gap <= 2 ? 2 : gap <= 5 ? 3 : gap <= 10 ? 4 : 5;
  const labels = checkpointTemplates.slice(0, steps).map((label, index) => {
    if (index === 2 && description.toLowerCase().includes('presentation')) {
      return 'Develop speaker notes and slide flow';
    }

    if (index === 2 && title.toLowerCase().includes('exam')) {
      return 'Work through timed practice questions';
    }

    return label;
  });

  return labels.map((label, index) => {
    const offset = Math.max(Math.round((gap / steps) * index), 0);
    const checkpointDate = format(max([today, addDays(today, offset)]), 'yyyy-MM-dd');

    return {
      id: createId('checkpoint'),
      title: label,
      dueDate: checkpointDate > dueDate ? dueDate : checkpointDate,
      completed: false,
    } satisfies Checkpoint;
  });
}

export function buildAssignment(draft: AssignmentDraft): Assignment {
  const now = new Date().toISOString();
  const normalizedDueDate = draft.dueDate || format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const checkpoints =
    draft.checkpoints && draft.checkpoints.length > 0
      ? draft.checkpoints.map((checkpoint) => ({
          id: createId('checkpoint'),
          title: checkpoint.title,
          dueDate: checkpoint.dueDate || normalizedDueDate,
          completed: false,
        }))
      : generateSmartCheckpoints(draft.title, normalizedDueDate, draft.description);

  const status = draft.status ?? 'not_started';
  const completedAt = status === 'completed' ? now : undefined;

  return {
    id: createId('assignment'),
    title: draft.title,
    subject: draft.subject,
    description: draft.description,
    dueDate: normalizedDueDate,
    priority: draft.priority,
    status,
    archived: false,
    createdAt: now,
    updatedAt: now,
    completedAt,
    source: draft.source ?? 'manual',
    checkpoints: checkpoints.map((checkpoint) => ({
      ...checkpoint,
      completed: status === 'completed' ? true : checkpoint.completed,
      completedAt: status === 'completed' ? now : undefined,
    })),
  };
}

export function normalizeExtractedAssignments(assignments: ExtractedAssignment[]) {
  return assignments
    .filter((assignment) => assignment.title.trim())
    .map((assignment) => ({
      ...assignment,
      subject: assignment.subject?.trim() || 'General',
      description: assignment.description?.trim() || 'Imported from assessment brief.',
      dueDate: assignment.dueDate || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      priority: assignment.priority ?? 'medium',
      checkpoints:
        assignment.checkpoints && assignment.checkpoints.length > 0
          ? assignment.checkpoints
          : undefined,
    }));
}

export function syncStatusWithProgress(assignment: Assignment): Assignment {
  const completed = assignment.checkpoints.filter((checkpoint) => checkpoint.completed).length;
  const allComplete = assignment.checkpoints.length > 0 && completed === assignment.checkpoints.length;
  const nextStatus: AssignmentStatus =
    assignment.status === 'reviewing' && completed === 0
      ? 'reviewing'
      : allComplete
        ? 'completed'
        : completed > 0 && assignment.status === 'not_started'
          ? 'in_progress'
          : assignment.status;

  return {
    ...assignment,
    status: nextStatus,
    completedAt: allComplete ? assignment.completedAt ?? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
}
