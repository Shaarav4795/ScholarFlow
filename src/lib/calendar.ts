import { format, parseISO } from 'date-fns';
import type { Assignment, PlannerEntry } from '@/types';

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function toIcsDate(date: string) {
  return format(parseISO(date), 'yyyyMMdd');
}

export function exportCalendar(assignments: Assignment[], planner: PlannerEntry[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarFlow//Planner//EN',
  ];

  assignments.forEach((assignment) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${assignment.id}@scholarflow`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART;VALUE=DATE:${toIcsDate(assignment.dueDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(assignment.dueDate)}`,
      `SUMMARY:${escapeIcs(`${assignment.title} due`)}`,
      `DESCRIPTION:${escapeIcs(assignment.description)}`,
      'END:VEVENT',
    );
  });

  planner.forEach((entry) => {
    const assignment = assignments.find((item) => item.id === entry.assignmentId);

    if (!assignment) {
      return;
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${entry.assignmentId}-${entry.date}@scholarflow`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART;VALUE=DATE:${toIcsDate(entry.date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(entry.date)}`,
      `SUMMARY:${escapeIcs(`Planned: ${assignment.title}`)}`,
      `DESCRIPTION:${escapeIcs(`Planner slot for ${assignment.subject}`)}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'scholarflow-calendar.ics';
  anchor.click();
  URL.revokeObjectURL(url);
}
