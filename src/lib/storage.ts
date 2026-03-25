import { addDays, format } from 'date-fns';
import type { AppData } from '@/types';
import { buildAssignment } from '@/lib/planning';
import { createId } from '@/lib/utils';

const STORAGE_KEY = 'scholarflow:data';
const CURRENT_VERSION = 1;

export function createSeedData(): AppData {
  const now = new Date();

  return {
    version: CURRENT_VERSION,
    assignments: [
      buildAssignment({
        title: 'Comparative essay draft',
        subject: 'English',
        description:
          'Compare the narrative voice in two set texts and support the response with close analysis.',
        dueDate: format(addDays(now, 3), 'yyyy-MM-dd'),
        priority: 'high',
        status: 'in_progress',
      }),
      buildAssignment({
        title: 'Chemistry practical write-up',
        subject: 'Chemistry',
        description:
          'Document findings from the titration experiment, include method evaluation and uncertainty discussion.',
        dueDate: format(addDays(now, 6), 'yyyy-MM-dd'),
        priority: 'medium',
      }),
      buildAssignment({
        title: 'Modern history source analysis',
        subject: 'History',
        description:
          'Respond to the source booklet using evidence, contextual links, and a short historiography paragraph.',
        dueDate: format(addDays(now, 9), 'yyyy-MM-dd'),
        priority: 'low',
      }),
    ],
    planner: [],
    imports: [],
    settings: {
      groqApiKey: '',
      groqModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
      theme: 'system',
      onboardingComplete: false,
    },
  };
}

export function normalizeData(data: AppData): AppData {
  return {
    ...data,
    version: CURRENT_VERSION,
    assignments: data.assignments ?? [],
    planner: data.planner ?? [],
    imports: data.imports ?? [],
    settings: {
      groqApiKey: data.settings?.groqApiKey ?? '',
      groqModel:
        data.settings?.groqModel ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
      theme: data.settings?.theme ?? 'system',
      onboardingComplete: data.settings?.onboardingComplete ?? false,
    },
  };
}

export function loadAppData() {
  if (typeof window === 'undefined') {
    return createSeedData();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seeded = createSeedData();
    saveAppData(seeded);
    return seeded;
  }

  try {
    return normalizeData(JSON.parse(raw) as AppData);
  } catch {
    const seeded = createSeedData();
    saveAppData(seeded);
    return seeded;
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAppData() {
  const seeded = createSeedData();
  saveAppData(seeded);
  return seeded;
}
