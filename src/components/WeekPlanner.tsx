import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import type { Assignment, PlannerEntry } from '@/types';
import { getPriorityMeta } from '@/lib/utils';

interface WeekPlannerProps {
  assignments: Assignment[];
  planner: PlannerEntry[];
  onSchedule: (assignmentId: string, date: string | null) => void;
}

export function WeekPlanner(props: WeekPlannerProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const plannerMap = new Map(props.planner.map((entry) => [entry.assignmentId, entry.date]));

  function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }

    const target = result.destination.droppableId;
    props.onSchedule(result.draggableId, target === 'backlog' ? null : target);
  }

  const activeAssignments = props.assignments.filter((assignment) => !assignment.archived);
  const unscheduledAssignments = activeAssignments.filter((assignment) => !plannerMap.has(assignment.id));

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Droppable droppableId="backlog">
          {(provided, snapshot) => (
            <section
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`rounded-[2rem] border p-4 transition ${
                snapshot.isDraggingOver
                  ? 'border-coral-500 bg-coral-500/8'
                  : 'border-ink-200/70 bg-white/75 dark:border-white/10 dark:bg-white/6'
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-ink-800 p-2 text-white dark:bg-ink-50 dark:text-ink-900">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">Backlog</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-200/70">
                    Drag assignments onto the week to commit time for them.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {unscheduledAssignments.map((assignment, index) => (
                  <Draggable draggableId={assignment.id} index={index} key={assignment.id}>
                    {(dragProvided, dragSnapshot) => (
                      <article
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`rounded-2xl border p-4 shadow-sm transition ${
                          dragSnapshot.isDragging
                            ? 'border-coral-500 bg-coral-500/10'
                            : 'border-ink-200/70 bg-white/90 dark:border-white/10 dark:bg-ink-900/80'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPriorityMeta(assignment.priority).pill}`}
                          >
                            {getPriorityMeta(assignment.priority).label}
                          </span>
                          <span className="text-xs text-ink-500 dark:text-ink-200/70">
                            Due {format(parseISO(assignment.dueDate), 'd MMM')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-ink-800 dark:text-ink-50">{assignment.title}</h4>
                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-200/70">{assignment.subject}</p>
                      </article>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {unscheduledAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-ink-300/80 p-4 text-sm text-ink-500 dark:border-white/10 dark:text-ink-200/70">
                    Everything is scheduled for this week. Nice work.
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </Droppable>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {days.map((day) => {
            const dayIso = format(day, 'yyyy-MM-dd');
            const scheduledAssignments = activeAssignments.filter(
              (assignment) => plannerMap.get(assignment.id) === dayIso,
            );

            return (
              <Droppable droppableId={dayIso} key={dayIso}>
                {(provided, snapshot) => (
                  <section
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-48 rounded-[2rem] border p-4 transition ${
                      snapshot.isDraggingOver
                        ? 'border-sage-500 bg-sage-500/10'
                        : 'border-ink-200/70 bg-white/75 dark:border-white/10 dark:bg-white/6'
                    }`}
                  >
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-ink-400 dark:text-ink-200/50">
                        {format(day, 'EEE')}
                      </p>
                      <h3 className="font-display text-2xl text-ink-800 dark:text-ink-50">
                        {format(day, 'd MMM')}
                      </h3>
                      {isSameDay(day, new Date()) ? (
                        <span className="mt-2 inline-flex rounded-full bg-coral-500/15 px-2.5 py-1 text-xs font-semibold text-coral-600 ring-1 ring-coral-500/20 dark:text-coral-400">
                          Today
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      {scheduledAssignments.map((assignment, index) => (
                        <Draggable draggableId={assignment.id} index={index} key={assignment.id}>
                          {(dragProvided, dragSnapshot) => (
                            <article
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`rounded-2xl border p-4 shadow-sm transition ${
                                dragSnapshot.isDragging
                                  ? 'border-coral-500 bg-coral-500/10'
                                  : 'border-ink-200/70 bg-white/90 dark:border-white/10 dark:bg-ink-900/80'
                              }`}
                            >
                              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400 dark:text-ink-200/50">
                                {assignment.subject}
                              </span>
                              <h4 className="mt-2 font-semibold text-ink-800 dark:text-ink-50">
                                {assignment.title}
                              </h4>
                            </article>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {scheduledAssignments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-ink-300/80 p-4 text-sm text-ink-500 dark:border-white/10 dark:text-ink-200/70">
                          Drop work here.
                        </div>
                      ) : null}
                    </div>
                  </section>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
