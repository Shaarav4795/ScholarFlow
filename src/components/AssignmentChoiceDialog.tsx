import * as Dialog from '@radix-ui/react-dialog';
import { Bot, FileText, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { AssignmentDialog, type AssignmentFormValues } from '@/components/AssignmentDialog';
import { AssignmentFormContent } from '@/components/AssignmentFormContent';
import { AIImportPanel } from '@/components/AIImportPanel';
import type { ExtractedAssignment, Settings } from '@/types';

interface AssignmentChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onManualAssignment: (values: AssignmentFormValues) => void;
  onAIImport: (assignments: ExtractedAssignment[], metadata: { fileName: string; notes: string }) => void;
}

export function AssignmentChoiceDialog({
  open,
  onOpenChange,
  settings,
  onManualAssignment,
  onAIImport,
}: AssignmentChoiceDialogProps) {
  const [mode, setMode] = useState<'choice' | 'manual' | 'ai'>('choice');

  function handleChoice(selectedMode: 'manual' | 'ai') {
    setMode(selectedMode);
  }

  function handleClose() {
    setMode('choice');
    onOpenChange(false);
  }

  function handleManualComplete(values: AssignmentFormValues) {
    onManualAssignment(values);
    setMode('choice');
    onOpenChange(false);
  }

  function handleAIComplete(assignments: ExtractedAssignment[], metadata: { fileName: string; notes: string }) {
    onAIImport(assignments, metadata);
    setMode('choice');
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-ink-900/90 backdrop-blur-xl" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[99999] w-[min(92vw,75.4rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/35 bg-ink-50/96 p-8 shadow-[0_30px_120px_rgba(22,23,19,0.32)] outline-none dark:border-ink-700 dark:bg-ink-800">
          {mode === 'choice' ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="font-display text-3xl text-ink-800 dark:text-ink-50">
                    Create Assignment
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                    Choose how you'd like to add your assignment.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-full border border-ink-300/70 p-2 text-ink-500 transition hover:border-coral-500 hover:text-coral-600 dark:border-ink-700 dark:text-ink-300">
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleChoice('manual')}
                  className="group rounded-2xl border border-ink-200/70 bg-white/80 p-6 text-left transition-all hover:border-sage-500 hover:bg-sage-500/6 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:hover:border-sage-400"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-500/12 text-sage-600 dark:text-sage-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl text-ink-800 dark:text-ink-50 group-hover:text-sage-700 dark:group-hover:text-sage-300">
                    Create Manually
                  </h3>
                  <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                    Type in the details yourself. Perfect for quick entries or when you have all the information ready.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-sage-600 dark:text-sage-400">
                    Fastest option • Full control
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChoice('ai')}
                  className="group rounded-2xl border border-ink-200/70 bg-white/80 p-6 text-left transition-all hover:border-coral-500 hover:bg-coral-500/6 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:hover:border-coral-400"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-500/12 text-coral-600 dark:text-coral-400">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl text-ink-800 dark:text-ink-50 group-hover:text-coral-700 dark:group-hover:text-coral-300">
                    Import with AI
                  </h3>
                  <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
                    Upload a PDF, screenshot, or document. AI will extract assignments and create checkpoints automatically.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-coral-600 dark:text-coral-400">
                    Smart extraction • Saves time
                  </div>
                </button>
              </div>
            </>
          ) : mode === 'manual' ? (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <Dialog.Title className="font-display text-2xl text-ink-800 dark:text-ink-50">
                    New Assignment
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                    Build a clear plan now and let ScholarFlow turn it into something manageable.
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('choice')}
                  className="rounded-full border border-ink-300/70 p-2 text-ink-500 transition hover:border-coral-500 hover:text-coral-600 dark:border-ink-700 dark:text-ink-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AssignmentFormContent
                onSubmit={handleManualComplete}
              />
            </div>
          ) : (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <Dialog.Title className="font-display text-2xl text-ink-800 dark:text-ink-50">
                    Import with AI
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                    Upload a document and let AI extract the assignments.
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('choice')}
                  className="rounded-full border border-ink-300/70 p-2 text-ink-500 transition hover:border-coral-500 hover:text-coral-600 dark:border-ink-700 dark:text-ink-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <AIImportPanel settings={settings} onImport={handleAIComplete} />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
