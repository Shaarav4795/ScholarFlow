import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { AssignmentFormValues } from '@/components/AssignmentDialog';
import { cn } from '@/lib/utils';

const assignmentSchema = z.object({
  title: z.string().min(2, 'Please add a title.'),
  subject: z.string().min(2, 'Please add a subject.'),
  description: z.string().min(8, 'Give yourself a little more detail to work with.'),
  dueDate: z.string().min(1, 'Choose a due date.'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['not_started', 'in_progress', 'reviewing', 'completed']),
  regenerateCheckpoints: z.boolean(),
});

const statusOptions: Array<{ value: any; label: string }> = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions: Array<{ value: any; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface AssignmentFormContentProps {
  onSubmit: (values: AssignmentFormValues) => void;
}

export function AssignmentFormContent({ onSubmit }: AssignmentFormContentProps) {
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      subject: '',
      description: '',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      priority: 'medium',
      status: 'not_started',
      regenerateCheckpoints: true,
    },
  });

  const errors = form.formState.errors;

  function inputClassName(hasError: boolean) {
    return cn(
      'w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:bg-ink-800 dark:text-ink-50',
      hasError
        ? 'border-coral-500/60'
        : 'border-ink-200/80 dark:border-ink-700',
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        onSubmit(values);
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" error={errors.title?.message}>
          <input
            {...form.register('title')}
            className={inputClassName(Boolean(errors.title))}
            placeholder="Research presentation"
          />
        </Field>
        <Field label="Subject" error={errors.subject?.message}>
          <input
            {...form.register('subject')}
            className={inputClassName(Boolean(errors.subject))}
            placeholder="Biology"
          />
        </Field>
      </div>

      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...form.register('description')}
          rows={5}
          className={inputClassName(Boolean(errors.description))}
          placeholder="Paste the brief, essay question, or the core requirements here. Markdown works nicely."
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Due Date" error={errors.dueDate?.message}>
          <input
            {...form.register('dueDate')}
            type="date"
            className={inputClassName(Boolean(errors.dueDate))}
          />
        </Field>

        <Field label="Priority">
          <select {...form.register('priority')} className={cn(inputClassName(false), 'pr-10')}>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select {...form.register('status')} className={cn(inputClassName(false), 'pr-10')}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-sage-500/25 bg-sage-500/10 p-4 text-sm text-ink-600 dark:text-ink-300">
        <input
          {...form.register('regenerateCheckpoints')}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-ink-300 text-sage-600 focus:ring-sage-500 dark:border-ink-600"
        />
        <span>
          <span className="mb-1 flex items-center gap-2 font-semibold text-ink-700 dark:text-ink-100">
            <Sparkles className="h-4 w-4" />
            Auto-generate smart checkpoints
          </span>
          <span className="text-ink-500 dark:text-ink-300">
            Best for quickly turning a big assignment into smaller, date-spread tasks.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="submit"
          className="rounded-full bg-ink-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 dark:bg-ink-50 dark:text-ink-800"
        >
          Create assignment
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">{props.label}</span>
      {props.children}
      {props.error ? <p className="text-sm text-coral-600">{props.error}</p> : null}
    </label>
  );
}
