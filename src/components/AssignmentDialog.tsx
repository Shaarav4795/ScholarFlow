import * as Dialog from '@radix-ui/react-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { Sparkles, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Assignment, AssignmentStatus, Priority } from '@/types';
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

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentDialogProps {
  open: boolean;
  assignment?: Assignment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignmentFormValues) => void;
}

const statusOptions: Array<{ value: AssignmentStatus; label: string }> = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function AssignmentDialog(props: AssignmentDialogProps) {
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

  useEffect(() => {
    if (!props.open) {
      return;
    }

    form.reset({
      title: props.assignment?.title ?? '',
      subject: props.assignment?.subject ?? '',
      description: props.assignment?.description ?? '',
      dueDate: props.assignment?.dueDate ?? format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      priority: props.assignment?.priority ?? 'medium',
      status: props.assignment?.status ?? 'not_started',
      regenerateCheckpoints: props.assignment ? false : true,
    });
  }, [props.assignment, props.open, form]);

  const errors = form.formState.errors;

  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/35 bg-ink-50/96 p-6 shadow-[0_30px_120px_rgba(22,23,19,0.32)] outline-none dark:border-white/10 dark:bg-ink-800/95">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-3xl text-ink-800 dark:text-ink-50">
                {props.assignment ? 'Edit Assignment' : 'New Assignment'}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-ink-500 dark:text-ink-200/70">
                Build a clear plan now and let ScholarFlow turn it into something manageable.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full border border-ink-300/70 p-2 text-ink-500 transition hover:border-coral-500 hover:text-coral-600 dark:border-white/10 dark:text-ink-200">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              props.onSubmit(values);
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
                <select {...form.register('priority')} className={inputClassName(false)}>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select {...form.register('status')} className={inputClassName(false)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-sage-500/25 bg-sage-500/10 p-4 text-sm text-ink-600 dark:text-ink-100">
              <input
                {...form.register('regenerateCheckpoints')}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-ink-300 text-sage-600 focus:ring-sage-500"
              />
              <span>
                <span className="mb-1 flex items-center gap-2 font-semibold text-ink-700 dark:text-ink-50">
                  <Sparkles className="h-4 w-4" />
                  Auto-generate smart checkpoints
                </span>
                <span className="text-ink-500 dark:text-ink-200/70">
                  Best for quickly turning a big assignment into smaller, date-spread tasks.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Dialog.Close className="rounded-full border border-ink-300/80 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-100">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-full bg-ink-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 dark:bg-ink-50 dark:text-ink-800"
              >
                {props.assignment ? 'Save changes' : 'Create assignment'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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

function inputClassName(hasError: boolean) {
  return cn(
    'w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:bg-ink-900/70 dark:text-ink-50',
    hasError
      ? 'border-coral-500/60'
      : 'border-ink-200/80 dark:border-white/10',
  );
}
