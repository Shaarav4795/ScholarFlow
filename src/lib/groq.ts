import { addDays, format, isMatch } from 'date-fns';
import type { ExtractedAssignment, Priority } from '@/types';

export interface AnalyzeDocumentInput {
  apiKey: string;
  model: string;
  fileName: string;
  context: string;
  images: string[];
}

function parseJsonFromText(text: string) {
  const withoutFence = text.replace(/```json|```/g, '').trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('The AI response did not contain valid JSON.');
  }

  return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)) as {
    assignments?: ExtractedAssignment[];
    summary?: string;
  };
}

function normalizePriority(value: string): Priority {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }

  return 'medium';
}

function normalizeDueDate(value: string) {
  return isMatch(value, 'yyyy-MM-dd') ? value : format(addDays(new Date(), 7), 'yyyy-MM-dd');
}

export async function analyzeAssessmentDocument(input: AnalyzeDocumentInput) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are an academic planning assistant. Return only valid JSON, never markdown or prose.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Analyze this assessment brief and extract every distinct assignment.',
                'Return JSON in the shape:',
                '{"assignments":[{"title":"","subject":"","description":"","dueDate":"YYYY-MM-DD","priority":"high|medium|low","checkpoints":[{"title":"","dueDate":"YYYY-MM-DD"}]}],"summary":""}',
                `Source file: ${input.fileName}`,
                input.context
                  ? `Additional context from the student: ${input.context}`
                  : 'Additional context from the student: none',
                'If the brief contains multiple tasks, include them all.',
                'If a due date is unclear, estimate conservatively and note the assumption in the description.',
                'Keep checkpoints practical and evenly spread before the due date.',
              ].join('\n'),
            },
            ...input.images.map((image) => ({
              type: 'image_url' as const,
              image_url: {
                url: image,
              },
            })),
          ],
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Groq request failed.');
  }

  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('Groq returned an unexpected response.');
  }

  const parsed = parseJsonFromText(content);

  return {
    summary: parsed.summary ?? 'Assignments extracted from assessment brief.',
    assignments:
      parsed.assignments?.map((assignment) => ({
        title: assignment.title?.trim() || 'Untitled assignment',
        subject: assignment.subject?.trim() || 'General',
        description: assignment.description?.trim() || 'Imported from assessment brief.',
        dueDate: normalizeDueDate(assignment.dueDate),
        priority: normalizePriority(assignment.priority),
        checkpoints: assignment.checkpoints?.map((checkpoint) => ({
          title: checkpoint.title?.trim() || 'Checkpoint',
          dueDate: normalizeDueDate(checkpoint.dueDate),
        })),
      })) ?? [],
  };
}
