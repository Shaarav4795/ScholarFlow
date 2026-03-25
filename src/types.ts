export const assignmentStatuses = [
  'not_started',
  'in_progress',
  'reviewing',
  'completed',
] as const;

export const priorities = ['high', 'medium', 'low'] as const;

export const themes = ['light', 'dark', 'ocean', 'forest', 'sunset', 'system'] as const;

export type AssignmentStatus = (typeof assignmentStatuses)[number];
export type Priority = (typeof priorities)[number];
export type ThemeMode = (typeof themes)[number];

export interface Checkpoint {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: AssignmentStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  source: 'manual' | 'ai';
  checkpoints: Checkpoint[];
}


export interface PlannerEntry {
  assignmentId: string;
  date: string;
}

export interface ImportRecord {
  id: string;
  fileName: string;
  importedAt: string;
  assignmentCount: number;
  notes: string;
  success: boolean;
}


export interface Settings {
  groqApiKey: string;
  groqModel: string;
  theme: ThemeMode;
  onboardingComplete: boolean;
}

export interface AppData {
  version: number;
  assignments: Assignment[];
  planner: PlannerEntry[];
  imports: ImportRecord[];
  settings: Settings;
}

export interface ExtractedCheckpoint {
  title: string;
  dueDate: string;
}

export interface ExtractedAssignment {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: Priority;
  checkpoints?: ExtractedCheckpoint[];
}
