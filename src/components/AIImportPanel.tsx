import { FileImage, FileText, Sparkles, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { analyzeAssessmentDocument } from '@/lib/groq';
import { normalizeExtractedAssignments } from '@/lib/planning';
import { extractDocumentImages } from '@/lib/pdf';
import { formatDateLabel, getPriorityMeta } from '@/lib/utils';
import type { ExtractedAssignment, Settings } from '@/types';

interface AIImportPanelProps {
  settings: Settings;
  onImport: (assignments: ExtractedAssignment[], metadata: { fileName: string; notes: string }) => void;
}

export function AIImportPanel(props: AIImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [summary, setSummary] = useState('');
  const [results, setResults] = useState<ExtractedAssignment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze() {
    if (!file) {
      toast.error('Choose a PDF or image first.');
      return;
    }

    if (!props.settings.groqApiKey.trim()) {
      toast.error('Add your Groq API key in Settings before using AI import.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const images = await extractDocumentImages(file);
      const response = await analyzeAssessmentDocument({
        apiKey: props.settings.groqApiKey,
        model: props.settings.groqModel,
        fileName: file.name,
        context,
        images,
      });
      const assignments = normalizeExtractedAssignments(response.assignments);

      if (assignments.length === 0) {
        throw new Error('The import completed, but no assignments were detected.');
      }

      setSummary(response.summary);
      setResults(assignments);
      toast.success(`Extracted ${assignments.length} assignment${assignments.length === 1 ? '' : 's'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to analyze the document.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-[2rem] border border-ink-200/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-coral-500/12 p-3 text-coral-600 dark:text-coral-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-3xl text-ink-800 dark:text-ink-50">AI import</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-200/70">Upload a brief and review the extracted tasks.</p>
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-ink-300/80 bg-ink-50/80 px-5 py-8 text-center transition hover:border-coral-500 hover:bg-coral-500/6 dark:border-white/10 dark:bg-ink-900/45">
          <UploadCloud className="mb-3 h-8 w-8 text-ink-500 dark:text-ink-100" />
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">
            {file ? file.name : 'Drop in a PDF or screenshot'}
          </span>
          <span className="mt-2 text-xs text-ink-500 dark:text-ink-200/70">
            Supports PDF, PNG, JPG, WEBP, and GIF.
          </span>
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResults([]);
              setSummary('');
            }}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">Extra context</span>
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-ink-200/80 bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50"
            placeholder="Optional: mention year level, teacher expectations, preferred pace, or anything the AI should know."
          />
        </label>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-50 dark:text-ink-800"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? 'Analyzing document...' : 'Analyze with Groq'}
        </button>

        <div className="mt-5 rounded-2xl border border-sage-500/20 bg-sage-500/10 p-4 text-sm text-ink-600 dark:text-ink-100">
          <div className="mb-2 font-semibold text-ink-700 dark:text-ink-50">Tips</div>
          <ul className="space-y-2 text-ink-500 dark:text-ink-200/70">
            <li>Use the original PDF or a clean screenshot.</li>
            <li>Add context only if the brief is unclear.</li>
            <li>Review the results before importing.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[2rem] border border-ink-200/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
              Preview
            </p>
            <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">Review before import</h3>
          </div>
          {results.length > 0 && file ? (
            <button
              type="button"
              onClick={() => {
                props.onImport(results, {
                  fileName: file.name,
                  notes: context || summary,
                });
                setResults([]);
                setSummary('');
                setContext('');
                setFile(null);
              }}
              className="rounded-full bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-700"
            >
              Import {results.length} assignment{results.length === 1 ? '' : 's'}
            </button>
          ) : null}
        </div>

        {summary ? (
          <div className="mb-4 rounded-2xl border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-ink-600 dark:text-ink-100">
            {summary}
          </div>
        ) : null}

        {results.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-ink-300/80 bg-ink-50/65 p-6 text-center dark:border-white/10 dark:bg-ink-900/40">
            <FileText className="mb-4 h-10 w-10 text-ink-400 dark:text-ink-200/50" />
            <h4 className="font-display text-2xl text-ink-700 dark:text-ink-50">No preview yet</h4>
            <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-200/70">
              Extracted assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((assignment, index) => (
              <article
                key={`${assignment.title}-${index}`}
                className="rounded-[1.75rem] border border-ink-200/70 bg-ink-50/70 p-5 dark:border-white/10 dark:bg-ink-900/40"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-ink-800 px-3 py-1 text-xs font-semibold text-white dark:bg-ink-50 dark:text-ink-900">
                    {assignment.subject}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPriorityMeta(assignment.priority).pill}`}
                  >
                    {getPriorityMeta(assignment.priority).label}
                  </span>
                  <span className="text-xs text-ink-500 dark:text-ink-200/70">
                    Due {formatDateLabel(assignment.dueDate)}
                  </span>
                </div>
                <h4 className="font-display text-2xl text-ink-800 dark:text-ink-50">
                  {assignment.title}
                </h4>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-200/70">
                  {assignment.description}
                </p>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {(assignment.checkpoints ?? []).map((checkpoint) => (
                    <div
                      key={`${checkpoint.title}-${checkpoint.dueDate}`}
                      className="rounded-2xl border border-ink-200/70 bg-white/85 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/6"
                    >
                      <div className="mb-1 flex items-center gap-2 font-semibold text-ink-700 dark:text-ink-50">
                        <FileImage className="h-4 w-4 text-ink-400 dark:text-ink-200/60" />
                        {checkpoint.title}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-200/70">
                        {formatDateLabel(checkpoint.dueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
