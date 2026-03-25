import * as Dialog from '@radix-ui/react-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const checkpointSchema = z.object({
  title: z.string().min(2, 'Please add a title.'),
  dueDate: z.string().min(1, 'Choose a due date.'),
});

export type CheckpointFormValues = z.infer<typeof checkpointSchema>;

interface CheckpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CheckpointFormValues) => void;
}

export function CheckpointDialog(props: CheckpointDialogProps) {
  const form = useForm<CheckpointFormValues>({
    resolver: zodResolver(checkpointSchema),
    defaultValues: {
      title: '',
      dueDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    },
  });

  const errors = form.formState.errors;

  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-ink-900/90 backdrop-blur-xl" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[99999] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/35 bg-ink-50/96 p-8 shadow-[0_30px_120px_rgba(22,23,19,0.32)] outline-none dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl text-ink-800 dark:text-ink-50">
                Add New Checkpoint
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                Create a new milestone to track your progress.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full border border-ink-300/70 p-2 text-ink-500 transition hover:border-coral-500 hover:text-coral-600 dark:border-ink-700 dark:text-ink-300">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              props.onSubmit(values);
              form.reset();
            })}
          >
            <div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">Title</span>
                <input
                  {...form.register('title')}
                  className={cn(
                    'w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:bg-ink-800 dark:text-ink-50',
                    errors.title
                      ? 'border-coral-500/60'
                      : 'border-ink-200/80 dark:border-ink-700',
                  )}
                  placeholder="Research outline"
                />
                {errors.title ? <p className="text-sm text-coral-600">{errors.title.message}</p> : null}
              </label>
            </div>

            <div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">Due Date</span>
                <input
                  {...form.register('dueDate')}
                  type="date"
                  className={cn(
                    'w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition placeholder:text-ink-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:bg-ink-800 dark:text-ink-50',
                    errors.dueDate
                      ? 'border-coral-500/60'
                      : 'border-ink-200/80 dark:border-ink-700',
                  )}
                />
                {errors.dueDate ? <p className="text-sm text-coral-600">{errors.dueDate.message}</p> : null}
              </label>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Dialog.Close className="rounded-full border border-ink-300/80 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:border-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-300">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-full bg-sage-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sage-700"
              >
                Add Checkpoint
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
