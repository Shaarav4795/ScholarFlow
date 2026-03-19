import * as Collapsible from '@radix-ui/react-collapsible';
import * as Tooltip from '@radix-ui/react-tooltip';
import confetti from 'canvas-confetti';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  BarChart3,
  Bot,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheckBig,
  Download,
  Flame,
  FolderKanban,
  Info,
  LayoutDashboard,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
  type ComponentType,
} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { AssignmentDialog, type AssignmentFormValues } from '@/components/AssignmentDialog';
import { AIImportPanel } from '@/components/AIImportPanel';
import { AssignmentCard } from '@/components/AssignmentCard';
import { CalendarBoard } from '@/components/CalendarBoard';
import { TourOverlay, type TourStep } from '@/components/TourOverlay';
import { WeekPlanner } from '@/components/WeekPlanner';
import { useScholarData } from '@/hooks/useScholarData';
import { exportCalendar } from '@/lib/calendar';
import { buildAssignment, syncStatusWithProgress } from '@/lib/planning';
import { clearAppData } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';
import {
  cn,
  formatDateLabel,
  getAssignmentProgress,
  getPriorityMeta,
  getRelativeLabel,
  getStreak,
  isDueToday,
  isOverdue,
  sortByDueDate,
} from '@/lib/utils';
import type {
  Assignment,
  AssignmentStatus,
  ExtractedAssignment,
  PlannerEntry,
  Priority,
  Settings,
  ThemeMode,
} from '@/types';

type TabKey =
  | 'dashboard'
  | 'assignments'
  | 'planner'
  | 'calendar'
  | 'ai'
  | 'archive'
  | 'settings';

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assignments', label: 'Assignments', icon: FolderKanban },
  { key: 'planner', label: 'Week Planner', icon: CalendarRange },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'ai', label: 'AI Import', icon: Bot },
  { key: 'archive', label: 'Archive', icon: Archive },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

const tourSteps: TourStep[] = [
  {
    id: 'brand',
    selector: '[data-tour="brand"]',
    title: 'Start here',
    description: 'Use the top bar to add work fast and keep your key actions in one place.',
  },
  {
    id: 'dashboard',
    selector: '[data-tour="dashboard"]',
    title: 'Check today first',
    description: 'This view shows what is due now and what should be tackled next.',
  },
  {
    id: 'assignments',
    selector: '[data-tour="assignments"]',
    title: 'Manage assignments',
    description: 'Open an assignment to update status, edit details, or tick off checkpoints.',
  },
  {
    id: 'planner',
    selector: '[data-tour="planner"]',
    title: 'Plan the week',
    description: 'Drag tasks into days so your workload is spread out instead of stacked late.',
  },
  {
    id: 'ai',
    selector: '[data-tour="ai"]',
    title: 'Use AI when helpful',
    description: 'Upload a PDF or screenshot and review the extracted tasks before importing them.',
  },
  {
    id: 'settings',
    selector: '[data-tour="settings"]',
    title: 'Finish setup',
    description: 'Add your Groq key in Settings, change theme, and replay this guide any time.',
  },
];

const tourTabMap: Partial<Record<TourStep['id'], TabKey>> = {
  dashboard: 'dashboard',
  assignments: 'assignments',
  planner: 'planner',
  calendar: 'calendar',
  ai: 'ai',
  settings: 'settings',
};

export default function App() {
  const { data, commit } = useScholarData();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const deferredSearch = useDeferredValue(assignmentSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    applyTheme(data.settings.theme);

    if (data.settings.theme !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [data.settings.theme]);

  useEffect(() => {
    if (!data.settings.onboardingComplete) {
      setTourOpen(true);
    }
  }, [data.settings.onboardingComplete]);

  const activeAssignments = sortByDueDate(data.assignments.filter((assignment) => !assignment.archived));
  const archivedAssignments = sortByDueDate(data.assignments.filter((assignment) => assignment.archived));
  const dueTodayAssignments = activeAssignments.filter(
    (assignment) => assignment.status !== 'completed' && isDueToday(assignment.dueDate),
  );
  const overdueAssignments = activeAssignments.filter(
    (assignment) => assignment.status !== 'completed' && isOverdue(assignment.dueDate),
  );
  const upcomingAssignments = activeAssignments.filter(
    (assignment) => assignment.status !== 'completed' && !isOverdue(assignment.dueDate),
  );
  const todayCheckpoints = activeAssignments.flatMap((assignment) =>
    assignment.checkpoints
      .filter((checkpoint) => !checkpoint.completed && isDueToday(checkpoint.dueDate))
      .map((checkpoint) => ({ assignment, checkpoint })),
  );
  const subjects = [
    ...new Set(data.assignments.map((assignment) => assignment.subject)),
  ].sort();
  const filteredAssignments = activeAssignments.filter((assignment) => {
    const matchesSearch = [assignment.title, assignment.subject, assignment.description]
      .join(' ')
      .toLowerCase()
      .includes(deferredSearch.trim().toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : assignment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' ? true : assignment.priority === priorityFilter;
    const matchesSubject = subjectFilter === 'all' ? true : assignment.subject === subjectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesSubject;
  });

  const streak = getStreak(data.assignments);
  const averageProgress = activeAssignments.length
    ? Math.round(
        activeAssignments.reduce((sum, assignment) => sum + getAssignmentProgress(assignment), 0) /
          activeAssignments.length,
      )
    : 0;

  function celebrate(message: string) {
    confetti({
      particleCount: 80,
      spread: 74,
      startVelocity: 28,
      origin: { y: 0.72 },
      colors: ['#eb6d45', '#dfb13b', '#5d7d49', '#5f96c4'],
    });
    toast.success(message);
  }

  function openNewAssignment() {
    setEditingAssignment(null);
    setAssignmentDialogOpen(true);
  }

  function handleSaveAssignment(values: AssignmentFormValues) {
    if (editingAssignment) {
      commit((draft) => {
        const index = draft.assignments.findIndex((assignment) => assignment.id === editingAssignment.id);

        if (index === -1) {
          return;
        }

        const current = draft.assignments[index];
        const generated = buildAssignment({
          title: values.title,
          subject: values.subject,
          description: values.description,
          dueDate: values.dueDate,
          priority: values.priority,
          status: values.status,
          source: current.source,
        });
        let checkpoints = values.regenerateCheckpoints ? generated.checkpoints : current.checkpoints;
        const now = new Date().toISOString();

        if (values.status === 'completed') {
          checkpoints = checkpoints.map((checkpoint) => ({
            ...checkpoint,
            completed: true,
            completedAt: checkpoint.completedAt ?? now,
          }));
        }

        if (values.status === 'not_started' && values.regenerateCheckpoints) {
          checkpoints = generated.checkpoints;
        }

        const updated = syncStatusWithProgress({
          ...current,
          title: values.title,
          subject: values.subject,
          description: values.description,
          dueDate: values.dueDate,
          priority: values.priority,
          status: values.status,
          checkpoints,
          updatedAt: now,
          completedAt: values.status === 'completed' ? current.completedAt ?? now : current.completedAt,
        });

        draft.assignments[index] = values.status === 'not_started' && values.regenerateCheckpoints
          ? { ...updated, completedAt: undefined }
          : updated;
      });

      toast.success('Assignment updated.');
    } else {
      const assignment = buildAssignment({
        title: values.title,
        subject: values.subject,
        description: values.description,
        dueDate: values.dueDate,
        priority: values.priority,
        status: values.status,
      });

      commit((draft) => {
        draft.assignments.unshift(assignment);
      });

      toast.success('Assignment created.');
    }

    setEditingAssignment(null);
    setAssignmentDialogOpen(false);
  }

  function handleToggleCheckpoint(assignmentId: string, checkpointId: string) {
    let completedCheckpoint = false;
    let completedAssignment = false;

    commit((draft) => {
      const assignmentIndex = draft.assignments.findIndex((assignment) => assignment.id === assignmentId);

      if (assignmentIndex === -1) {
        return;
      }

      const assignment = draft.assignments[assignmentIndex];
      const checkpointIndex = assignment.checkpoints.findIndex((checkpoint) => checkpoint.id === checkpointId);

      if (checkpointIndex === -1) {
        return;
      }

      const now = new Date().toISOString();
      const checkpoint = assignment.checkpoints[checkpointIndex];
      const nextCompleted = !checkpoint.completed;

      assignment.checkpoints[checkpointIndex] = {
        ...checkpoint,
        completed: nextCompleted,
        completedAt: nextCompleted ? now : undefined,
      };

      const synced = syncStatusWithProgress({
        ...assignment,
        updatedAt: now,
      });

      draft.assignments[assignmentIndex] = synced;
      completedCheckpoint = nextCompleted;
      completedAssignment = synced.status === 'completed';
    });

    if (completedAssignment) {
      celebrate('Assignment completed. Beautiful work.');
      return;
    }

    if (completedCheckpoint) {
      confetti({
        particleCount: 28,
        spread: 58,
        startVelocity: 20,
        origin: { y: 0.72 },
        colors: ['#5d7d49', '#dfb13b'],
      });
      toast.success('Checkpoint completed.');
    }
  }

  function handleStatusChange(assignmentId: string, status: AssignmentStatus) {
    commit((draft) => {
      const assignmentIndex = draft.assignments.findIndex((assignment) => assignment.id === assignmentId);

      if (assignmentIndex === -1) {
        return;
      }

      const assignment = draft.assignments[assignmentIndex];
      const now = new Date().toISOString();

      let checkpoints = assignment.checkpoints;

      if (status === 'completed') {
        checkpoints = checkpoints.map((checkpoint) => ({
          ...checkpoint,
          completed: true,
          completedAt: checkpoint.completedAt ?? now,
        }));
      }

      if (status === 'not_started' && assignment.status === 'completed') {
        checkpoints = checkpoints.map((checkpoint) => ({
          ...checkpoint,
          completed: false,
          completedAt: undefined,
        }));
      }

      draft.assignments[assignmentIndex] = syncStatusWithProgress({
        ...assignment,
        status,
        checkpoints,
        completedAt: status === 'completed' ? assignment.completedAt ?? now : undefined,
        updatedAt: now,
      });
    });

    if (status === 'completed') {
      celebrate('Assignment completed. Nice one.');
    }
  }

  function handleArchiveToggle(assignmentId: string, archived: boolean) {
    commit((draft) => {
      const assignment = draft.assignments.find((item) => item.id === assignmentId);

      if (!assignment) {
        return;
      }

      assignment.archived = archived;
      assignment.updatedAt = new Date().toISOString();

      if (archived) {
        draft.planner = draft.planner.filter((entry) => entry.assignmentId !== assignmentId);
      }
    });

    toast.success(archived ? 'Assignment archived.' : 'Assignment restored.');
  }

  function handleScheduleAssignment(assignmentId: string, date: string | null) {
    commit((draft) => {
      draft.planner = draft.planner.filter((entry) => entry.assignmentId !== assignmentId);

      if (date) {
        draft.planner.push({ assignmentId, date });
      }
    });
  }

  
  function handleImportAssignments(
    assignments: ExtractedAssignment[],
    metadata: { fileName: string; notes: string },
  ) {
    const built = assignments.map((assignment) =>
      buildAssignment({
        ...assignment,
        source: 'ai',
      }),
    );

    commit((draft) => {
      draft.assignments = [...built, ...draft.assignments];
      draft.imports.unshift({
        id: `import_${Math.random().toString(36).slice(2, 10)}`,
        fileName: metadata.fileName,
        importedAt: new Date().toISOString(),
        assignmentCount: built.length,
        notes: metadata.notes,
        success: true,
      });
    });

    toast.success(`Imported ${built.length} assignment${built.length === 1 ? '' : 's'}.`);
    startTransition(() => setActiveTab('assignments'));
  }

  function updateSettings(mutator: (settings: Settings) => void) {
    commit((draft) => {
      mutator(draft.settings);
    });
  }

  function handleExportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'scholarflow-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleResetData() {
    if (!window.confirm('Reset ScholarFlow back to the starter dataset? This overwrites your saved browser data.')) {
      return;
    }

    commit(() => clearAppData());
    setActiveTab('dashboard');
    toast.success('ScholarFlow has been reset.');
  }

  function finishTour() {
    updateSettings((settings) => {
      settings.onboardingComplete = true;
    });
    setTourOpen(false);
  }

  function skipTour() {
    finishTour();
  }

  function handleTabChange(tab: TabKey) {
    startTransition(() => setActiveTab(tab));
  }

  return (
    <Tooltip.Provider delayDuration={100}>
      <div className="grain-overlay" />
      <main className="relative min-h-screen px-4 py-5 md:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-[1320px] space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <header className="rounded-[1.75rem] border border-white/40 bg-white/72 px-5 py-4 shadow-[0_18px_48px_rgba(22,23,19,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div data-tour="brand">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-200/55">
                  ScholarFlow
                </p>
                <h1 className="mt-2 font-display text-3xl text-ink-800 sm:text-[2.4rem] dark:text-ink-50">
                  Stay on top of schoolwork.
                </h1>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-200/70">
                  {dueTodayAssignments.length} due today · {overdueAssignments.length} overdue · {streak}-day streak
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-ink-200/80 px-3 py-2 text-sm font-medium text-ink-500 dark:border-white/10 dark:text-ink-200/70">
                  {data.settings.profile.name}
                </span>
                <button
                  type="button"
                  onClick={openNewAssignment}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700 dark:bg-ink-50 dark:text-ink-800"
                >
                  <Plus className="h-4 w-4" />
                  New assignment
                </button>
              </div>
            </div>
          </header>

          <div className="rounded-[1.5rem] border border-white/35 bg-white/70 p-2 shadow-[0_12px_32px_rgba(22,23,19,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-white/6">
            <nav className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-ink-800 text-white dark:bg-ink-50 dark:text-ink-900'
                        : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-200/70 dark:hover:bg-white/8 dark:hover:text-ink-50',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <section className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {activeTab === 'dashboard' ? (
                    <div className="space-y-4" data-tour="dashboard">
                      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                          label="Due Today"
                          value={dueTodayAssignments.length}
                          hint="Assignments with deadlines on the current day."
                          accent="coral"
                        />
                        <MetricCard
                          label="Overdue"
                          value={overdueAssignments.length}
                          hint="Assignments that slipped past their due date."
                          accent="gold"
                        />
                        <MetricCard
                          label="Average Progress"
                          value={`${averageProgress}%`}
                          hint="Average completion across all active assignments."
                          accent="sky"
                        />
                        <MetricCard
                          label="Streak"
                          value={`${streak} days`}
                          hint="Consecutive days with completed work."
                          accent="sage"
                        />
                      </section>

                      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                        <Surface className="p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-ink-400 dark:text-ink-200/50">
                                Today
                              </p>
                              <h2 className="mt-1 font-display text-3xl text-ink-800 dark:text-ink-50">
                                What needs attention now
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTabChange('assignments')}
                              className="rounded-full border border-ink-200/80 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-50"
                            >
                              Open assignments
                            </button>
                          </div>

                          <div className="space-y-3">
                            {dueTodayAssignments.length === 0 && todayCheckpoints.length === 0 ? (
                              <div className="rounded-[1.4rem] border border-dashed border-ink-300/80 bg-ink-50/70 px-4 py-5 text-sm text-ink-500 dark:border-white/10 dark:bg-white/4 dark:text-ink-200/70">
                                Nothing urgent today.
                              </div>
                            ) : null}

                            {dueTodayAssignments.map((assignment) => (
                              <TaskRow
                                key={assignment.id}
                                title={assignment.title}
                                meta={`${assignment.subject} · due today`}
                                tone="coral"
                              />
                            ))}

                            {todayCheckpoints.map(({ assignment, checkpoint }) => (
                              <TaskRow
                                key={checkpoint.id}
                                title={checkpoint.title}
                                meta={assignment.title}
                                tone="sage"
                              />
                            ))}
                          </div>
                        </Surface>

                        <Surface className="p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-ink-400 dark:text-ink-200/50">
                                Up next
                              </p>
                              <h2 className="mt-1 font-display text-3xl text-ink-800 dark:text-ink-50">
                                Next deadlines
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTabChange('planner')}
                              className="rounded-full border border-ink-200/80 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-50"
                            >
                              Plan week
                            </button>
                          </div>

                          <div className="space-y-3">
                            {upcomingAssignments.slice(0, 5).map((assignment) => (
                              <TaskRow
                                key={assignment.id}
                                title={assignment.title}
                                meta={`${assignment.subject} · ${getRelativeLabel(assignment.dueDate)}`}
                                tone={assignment.priority === 'high' ? 'coral' : assignment.priority === 'medium' ? 'gold' : 'sage'}
                              />
                            ))}
                          </div>
                        </Surface>
                      </section>
                    </div>
                  ) : null}

                  {activeTab === 'assignments' ? (
                    <div className="space-y-4" data-tour="assignments">
                      <Surface className="p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                              Assignments
                            </p>
                            <h2 className="font-display text-3xl text-ink-800 dark:text-ink-50">
                              Everything in one list
                            </h2>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <label className="relative min-w-[220px]">
                              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-200/50" />
                              <input
                                value={assignmentSearch}
                                onChange={(event) => setAssignmentSearch(event.target.value)}
                                placeholder="Search assignments"
                                className="w-full rounded-full border border-ink-200/80 bg-white/80 py-3 pl-10 pr-4 text-sm text-ink-700 outline-none transition focus:border-sage-500 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50"
                              />
                            </label>
                            <select
                              value={statusFilter}
                              onChange={(event) => setStatusFilter(event.target.value as 'all' | AssignmentStatus)}
                              className="rounded-full border border-ink-200/80 bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-sage-500 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50"
                            >
                              <option value="all">All statuses</option>
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="completed">Completed</option>
                            </select>
                            <select
                              value={priorityFilter}
                              onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}
                              className="rounded-full border border-ink-200/80 bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-sage-500 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50"
                            >
                              <option value="all">All priorities</option>
                              <option value="high">High priority</option>
                              <option value="medium">Medium priority</option>
                              <option value="low">Low priority</option>
                            </select>
                            <select
                              value={subjectFilter}
                              onChange={(event) => setSubjectFilter(event.target.value)}
                              className="rounded-full border border-ink-200/80 bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-sage-500 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50"
                            >
                              <option value="all">All subjects</option>
                              {subjects.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </Surface>

                      <div className="space-y-4">
                        {filteredAssignments.length === 0 ? (
                          <EmptyState
                            title="No assignments match these filters"
                            description="Try broadening the filters or create a fresh assignment to get the board moving again."
                            actionLabel="Create assignment"
                            onAction={openNewAssignment}
                          />
                        ) : (
                          filteredAssignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              assignment={assignment}
                              onEdit={(item) => {
                                setEditingAssignment(item);
                                setAssignmentDialogOpen(true);
                              }}
                              onArchiveToggle={handleArchiveToggle}
                              onStatusChange={handleStatusChange}
                              onToggleCheckpoint={handleToggleCheckpoint}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'planner' ? (
                    <div className="space-y-4" data-tour="planner">
                      <Surface className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                              Planner
                            </p>
                            <h2 className="font-display text-3xl text-ink-800 dark:text-ink-50">
                              Drag work into the week
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => exportCalendar(activeAssignments, data.planner)}
                            className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-50"
                          >
                            <Download className="h-4 w-4" />
                            Export calendar
                          </button>
                        </div>
                      </Surface>

                      <WeekPlanner
                        assignments={activeAssignments}
                        planner={data.planner}
                        onSchedule={handleScheduleAssignment}
                      />
                    </div>
                  ) : null}

                  {activeTab === 'calendar' ? (
                    <div className="space-y-4" data-tour="calendar">
                      <section className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                          label="Assignments this month"
                          value={activeAssignments.length}
                          hint="All active assignments currently stored."
                          accent="sky"
                        />
                        <MetricCard
                          label="Planner slots"
                          value={data.planner.length}
                          hint="Scheduled assignment placements for the week."
                          accent="sage"
                        />
                        <MetricCard
                          label="Archive ready"
                          value={activeAssignments.filter((assignment) => assignment.status === 'completed').length}
                          hint="Completed assignments that can be archived for reference."
                          accent="gold"
                        />
                      </section>
                      <CalendarBoard assignments={activeAssignments} />
                    </div>
                  ) : null}

                  {activeTab === 'ai' ? (
                    <div className="space-y-4" data-tour="ai">
                      <AIImportPanel settings={data.settings} onImport={handleImportAssignments} />
                      <Surface className="p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                          Import history
                        </p>
                        <h3 className="mt-2 font-display text-2xl text-ink-800 dark:text-ink-50">
                          Recent imports
                        </h3>
                        <div className="mt-4 space-y-3">
                          {data.imports.length === 0 ? (
                            <p className="text-sm text-ink-500 dark:text-ink-200/70">
                              No AI imports yet. Upload a task sheet to create your first one.
                            </p>
                          ) : (
                            data.imports.slice(0, 5).map((record) => (
                              <div
                                key={record.id}
                                className="rounded-[1.4rem] border border-ink-200/70 bg-ink-50/70 px-4 py-3 dark:border-white/10 dark:bg-ink-900/40"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="font-semibold text-ink-800 dark:text-ink-50">
                                      {record.fileName}
                                    </div>
                                    <div className="text-sm text-ink-500 dark:text-ink-200/70">
                                      Imported {record.assignmentCount} assignment
                                      {record.assignmentCount === 1 ? '' : 's'} on{' '}
                                      {format(parseISO(record.importedAt), 'd MMM yyyy')}
                                    </div>
                                  </div>
                                  <span className="rounded-full bg-sage-500/15 px-3 py-1 text-xs font-semibold text-sage-700 ring-1 ring-sage-500/20 dark:text-sage-300">
                                    Success
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Surface>
                    </div>
                  ) : null}

                  {activeTab === 'archive' ? (
                    <div className="space-y-4" data-tour="archive">
                      <Surface className="p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                          Archive
                        </p>
                        <h2 className="font-display text-3xl text-ink-800 dark:text-ink-50">
                          Archived work
                        </h2>
                      </Surface>

                      <div className="space-y-4">
                        {archivedAssignments.length === 0 ? (
                          <EmptyState
                            title="Nothing archived yet"
                            description="Archive completed assignments when you want the active board to stay lean."
                          />
                        ) : (
                          archivedAssignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              assignment={assignment}
                              archived
                              onEdit={(item) => {
                                setEditingAssignment(item);
                                setAssignmentDialogOpen(true);
                              }}
                              onArchiveToggle={handleArchiveToggle}
                              onStatusChange={handleStatusChange}
                              onToggleCheckpoint={handleToggleCheckpoint}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'settings' ? (
                    <div className="space-y-4" data-tour="settings">
                      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                        <Surface className="p-5">
                          <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                            Profile
                          </p>
                          <h2 className="mt-2 font-display text-3xl text-ink-800 dark:text-ink-50">
                            Personal settings
                          </h2>

                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <SettingsField label="Name">
                              <input
                                value={data.settings.profile.name}
                                onChange={(event) =>
                                  updateSettings((settings) => {
                                    settings.profile.name = event.target.value;
                                  })
                                }
                                className={settingsInputClass}
                              />
                            </SettingsField>
                            <SettingsField label="Term start date">
                              <input
                                type="date"
                                value={data.settings.profile.termStartDate}
                                onChange={(event) =>
                                  updateSettings((settings) => {
                                    settings.profile.termStartDate = event.target.value;
                                  })
                                }
                                className={settingsInputClass}
                              />
                            </SettingsField>
                          </div>

                          <div className="mt-4">
                            <SettingsField label="Study focus">
                              <textarea
                                rows={4}
                                value={data.settings.profile.studyFocus}
                                onChange={(event) =>
                                  updateSettings((settings) => {
                                    settings.profile.studyFocus = event.target.value;
                                  })
                                }
                                className={settingsInputClass}
                              />
                            </SettingsField>
                          </div>

                          <div className="mt-6">
                            <div className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-50">
                              Theme
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(['light', 'dark', 'system'] as ThemeMode[]).map((theme) => (
                                <button
                                  key={theme}
                                  type="button"
                                  onClick={() =>
                                    updateSettings((settings) => {
                                      settings.theme = theme;
                                    })
                                  }
                                  className={cn(
                                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                                    data.settings.theme === theme
                                      ? 'bg-ink-800 text-white dark:bg-ink-50 dark:text-ink-900'
                                      : 'border border-ink-200/80 text-ink-700 hover:border-ink-500 dark:border-white/10 dark:text-ink-50',
                                  )}
                                >
                                  {theme[0].toUpperCase() + theme.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </Surface>

                        <Surface className="p-5">
                          <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                            Groq
                          </p>
                          <h3 className="mt-2 font-display text-2xl text-ink-800 dark:text-ink-50">
                            AI setup
                          </h3>

                          <div className="mt-5 space-y-4">
                            <SettingsField label="Groq API key">
                              <input
                                type="password"
                                value={data.settings.groqApiKey}
                                onChange={(event) =>
                                  updateSettings((settings) => {
                                    settings.groqApiKey = event.target.value;
                                  })
                                }
                                placeholder="gsk_..."
                                className={settingsInputClass}
                              />
                            </SettingsField>

                            <SettingsField label="Vision model">
                              <input
                                value={data.settings.groqModel}
                                onChange={(event) =>
                                  updateSettings((settings) => {
                                    settings.groqModel = event.target.value;
                                  })
                                }
                                className={settingsInputClass}
                              />
                            </SettingsField>
                          </div>

                          <div className="mt-6 rounded-[1.6rem] border border-sage-500/20 bg-sage-500/10 p-4 text-sm text-ink-600 dark:text-ink-100">
                            Your API key stays in browser storage on this device.
                          </div>
                        </Surface>
                      </section>

                      <Surface className="p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                          Data controls
                        </p>
                        <h3 className="mt-2 font-display text-3xl text-ink-800 dark:text-ink-50">
                          Backup, reset, and onboarding
                        </h3>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleExportData}
                            className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-50"
                          >
                            <Download className="h-4 w-4" />
                            Export data JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTourOpen(true);
                              updateSettings((settings) => {
                                settings.onboardingComplete = false;
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Replay onboarding
                          </button>
                          <button
                            type="button"
                            onClick={handleResetData}
                            className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-600"
                          >
                            Reset demo data
                          </button>
                        </div>
                      </Surface>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </section>
        </motion.div>
      </main>

      <AssignmentDialog
        open={assignmentDialogOpen}
        assignment={editingAssignment}
        onOpenChange={(open) => {
          setAssignmentDialogOpen(open);
          if (!open) {
            setEditingAssignment(null);
          }
        }}
        onSubmit={handleSaveAssignment}
      />

      <TourOverlay
        open={tourOpen}
        steps={tourSteps}
        refreshKey={activeTab}
        onSkip={skipTour}
        onComplete={finishTour}
        onStepChange={(step) => {
          const tab = tourTabMap[step.id];
          if (tab) {
            startTransition(() => setActiveTab(tab));
          }
        }}
      />
    </Tooltip.Provider>
  );
}

function Surface(props: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-[2rem] border border-white/35 bg-white/70 shadow-[0_18px_60px_rgba(22,23,19,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/6',
        props.className,
      )}
    >
      {props.children}
    </section>
  );
}

function MetricCard(props: {
  label: string;
  value: string | number;
  hint: string;
  accent: 'coral' | 'gold' | 'sage' | 'sky';
}) {
  const accentClass = {
    coral: 'from-coral-500/16 to-coral-500/5 text-coral-600 dark:text-coral-400',
    gold: 'from-gold-400/18 to-gold-400/5 text-ink-700 dark:text-gold-300',
    sage: 'from-sage-500/16 to-sage-500/5 text-sage-700 dark:text-sage-300',
    sky: 'from-sky-400/16 to-sky-400/5 text-sky-400',
  }[props.accent];

  return (
    <Surface className="p-4">
      <div className={`rounded-[1.2rem] bg-gradient-to-br px-4 py-3 ${accentClass}`}>
        <div className="text-xs uppercase tracking-[0.22em]">{props.label}</div>
        <div className="mt-2 font-display text-3xl">{props.value}</div>
      </div>
    </Surface>
  );
}

function TaskRow(props: {
  title: string;
  meta: string;
  tone: 'coral' | 'gold' | 'sage';
}) {
  const toneClass = {
    coral: 'bg-coral-500/10 text-coral-600 dark:text-coral-400',
    gold: 'bg-gold-400/10 text-ink-700 dark:text-gold-300',
    sage: 'bg-sage-500/10 text-sage-700 dark:text-sage-300',
  }[props.tone];

  return (
    <div className="rounded-[1.2rem] border border-ink-200/70 bg-ink-50/75 px-4 py-3 dark:border-white/10 dark:bg-white/4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-800 dark:text-ink-50">
            {props.title}
          </div>
          <div className="mt-1 text-xs text-ink-500 dark:text-ink-200/70">{props.meta}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
          {props.tone}
        </span>
      </div>
    </div>
  );
}

function EmptyState(props: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Surface className="p-10 text-center">
      <h3 className="font-display text-3xl text-ink-800 dark:text-ink-50">{props.title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 dark:text-ink-200/70">
        {props.description}
      </p>
      {props.actionLabel && props.onAction ? (
        <button
          type="button"
          onClick={props.onAction}
          className="mt-5 rounded-full bg-ink-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 dark:bg-ink-50 dark:text-ink-800"
        >
          {props.actionLabel}
        </button>
      ) : null}
    </Surface>
  );
}

function SettingsField(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink-700 dark:text-ink-50">{props.label}</span>
      {props.children}
    </label>
  );
}

const settingsInputClass =
  'w-full rounded-2xl border border-ink-200/80 bg-white/80 px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 dark:border-white/10 dark:bg-ink-900/70 dark:text-ink-50';
