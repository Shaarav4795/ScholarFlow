import ReactMarkdown from 'react-markdown';
import { Archive, Edit3, Plus, RotateCcw } from 'lucide-react';
import type { Assignment, AssignmentStatus } from '@/types';
import {
  cn,
  formatDateLabel,
  getAssignmentProgress,
  getPriorityMeta,
  getRelativeLabel,
  getStatusMeta,
} from '@/lib/utils';

interface AssignmentCardProps {
  assignment: Assignment;
  archived?: boolean;
  onEdit: (assignment: Assignment) => void;
  onArchiveToggle: (assignmentId: string, archived: boolean) => void;
  onStatusChange: (assignmentId: string, status: AssignmentStatus) => void;
  onToggleCheckpoint: (assignmentId: string, checkpointId: string) => void;
  onAddCheckpoint?: (assignmentId: string) => void;
}

const statusOptions: AssignmentStatus[] = [
  'not_started',
  'in_progress',
  'reviewing',
  'completed',
];

export function AssignmentCard(props: AssignmentCardProps) {
  const progress = getAssignmentProgress(props.assignment);
  const priority = getPriorityMeta(props.assignment.priority);
  const status = getStatusMeta(props.assignment.status);

  return (
    <article className="rounded-[1.6rem] border border-ink-200/70 bg-white/80 p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priority.pill}`}
            >
              {priority.label}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.pill}`}
            >
              {status.label}
            </span>
            {props.assignment.source === 'ai' ? (
              <span className="rounded-full bg-sky-400/12 px-3 py-1 text-xs font-semibold text-sky-400 ring-1 ring-sky-400/20">
                AI Imported
              </span>
            ) : null}
            <span className="text-xs uppercase tracking-[0.24em] text-ink-400 dark:text-ink-300">
              {props.assignment.subject}
            </span>
          </div>

          <div>
            <h3 className="font-display text-3xl text-ink-800 dark:text-ink-50">
              {props.assignment.title}
            </h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              Due {formatDateLabel(props.assignment.dueDate)} · {getRelativeLabel(props.assignment.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={props.assignment.status}
            onChange={(event) =>
              props.onStatusChange(props.assignment.id, event.target.value as AssignmentStatus)
            }
            className="rounded-full border border-ink-200/80 bg-white/80 px-3 py-2 pr-8 text-sm font-semibold text-ink-700 outline-none hover:border-ink-400 focus:border-sage-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50"
            aria-label={`Status for ${props.assignment.title}`}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {getStatusMeta(option).label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => props.onEdit(props.assignment)}
            className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-200"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => props.onArchiveToggle(props.assignment.id, !props.archived)}
            className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-200"
          >
            {props.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {props.archived ? 'Restore' : 'Archive'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-[1.25rem] border border-ink-200/70 bg-ink-50/80 p-4 dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-ink-400 dark:text-ink-300">
                Notes
              </p>
            </div>
            <div className="text-sm font-semibold text-ink-500 dark:text-ink-300">
              {progress}% done
            </div>
          </div>

          <div className="mb-4 h-3 overflow-hidden rounded-full bg-ink-200/80 dark:bg-ink-700">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress === 100 ? 'bg-sage-500' : 'bg-coral-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="markdown-body text-sm leading-6 text-ink-600 dark:text-ink-200">
            <ReactMarkdown>{props.assignment.description}</ReactMarkdown>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-ink-200/70 bg-white/75 p-4 dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-300">
              Monthly calendar
            </p>
            <button
              type="button"
              onClick={() => props.onAddCheckpoint?.(props.assignment.id)}
              className="inline-flex items-center gap-2 rounded-full border border-sage-500/50 bg-sage-500/10 px-3 py-1.5 text-xs font-semibold text-sage-600 transition hover:border-sage-500 hover:bg-sage-500/20 dark:border-sage-400/50 dark:bg-sage-400/10 dark:text-sage-400 dark:hover:border-sage-400 dark:hover:bg-sage-400/20"
            >
              <Plus className="h-3 w-3" />
              Make new checkpoint
            </button>
          </div>

          <div className="space-y-3">
            {props.assignment.checkpoints.map((checkpoint) => (
              <label
                key={checkpoint.id}
                className="flex items-start gap-3 rounded-2xl border border-sage-500/25 bg-sage-500/10 p-4 text-sm text-ink-600 dark:text-ink-300"
              >
                <input
                  type="checkbox"
                  checked={checkpoint.completed}
                  onChange={() => props.onToggleCheckpoint(props.assignment.id, checkpoint.id)}
                  className="mt-1 h-4 w-4 rounded border-ink-300 text-sage-600 focus:ring-sage-500 dark:border-ink-600"
                />
                <span>
                  <span className="mb-1 flex items-center gap-2 font-semibold text-ink-700 dark:text-ink-100">
                    {checkpoint.title}
                  </span>
                  <span className="text-ink-500 dark:text-ink-300">
                    {formatDateLabel(checkpoint.dueDate)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
