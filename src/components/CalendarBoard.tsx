import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Assignment } from '@/types';
import { getPriorityMeta } from '@/lib/utils';

interface CalendarBoardProps {
  assignments: Assignment[];
}

export function CalendarBoard(props: CalendarBoardProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  return (
    <section className="rounded-[2rem] border border-ink-200/70 bg-white/75 p-5 dark:border-white/10 dark:bg-white/6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
            Monthly calendar
          </p>
          <h3 className="font-display text-3xl text-ink-800 dark:text-ink-50">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((value) => subMonths(value, 1))}
            className="rounded-full border border-ink-200/80 p-2 text-ink-600 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-100"
            aria-label="View previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="rounded-full border border-ink-200/80 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
            className="rounded-full border border-ink-200/80 p-2 text-ink-600 transition hover:border-ink-500 hover:text-ink-800 dark:border-white/10 dark:text-ink-100"
            aria-label="View next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-400 dark:text-ink-200/50">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const dayAssignments = props.assignments.filter((assignment) =>
            parseISO(assignment.dueDate).toDateString() === day.toDateString(),
          );

          return (
            <article
              key={day.toISOString()}
              className={`min-h-36 rounded-[1.5rem] border p-3 ${
                isSameMonth(day, currentMonth)
                  ? 'border-ink-200/70 bg-ink-50/70 dark:border-white/10 dark:bg-ink-900/40'
                  : 'border-transparent bg-white/30 text-ink-400 dark:bg-white/4 dark:text-ink-200/45'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday(day)
                      ? 'bg-coral-500 text-white'
                      : 'text-ink-700 dark:text-ink-50'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayAssignments.length > 0 ? (
                  <span className="text-xs font-semibold text-ink-400 dark:text-ink-200/50">
                    {dayAssignments.length} due
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                {dayAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`rounded-xl px-3 py-2 text-left text-xs font-semibold ring-1 ${getPriorityMeta(assignment.priority).pill}`}
                  >
                    <div>{assignment.title}</div>
                    <div className="mt-1 text-[11px] opacity-70">{assignment.subject}</div>
                  </div>
                ))}
                {dayAssignments.length > 3 ? (
                  <div className="text-xs text-ink-400 dark:text-ink-200/50">
                    +{dayAssignments.length - 3} more
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
