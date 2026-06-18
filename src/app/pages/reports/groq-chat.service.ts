import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { ChatMessage } from '../../components/dynamic/types';
import type { ReportResponse } from '../../models/report.model';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const JSON_START = '|||JSON|||';
const JSON_END = '|||FIN|||';

const SYSTEM_PROMPT = `Eres un asistente de análisis del sistema Territorial.
Cuando el usuario solicite datos estadísticos, comparativas o tendencias, incluye
el JSON de la gráfica en tu respuesta usando exactamente estas marcas:

${JSON_START}{"type":"pie","labels":["A","B"],"series":[10,20]}${JSON_END}

Formatos admitidos:
• Distribución → {"type":"pie","labels":[...],"series":[n,...]}
• Comparación  → {"type":"bar","labels":[...],"series":[{"name":"...","data":[n,...]}]}
• Tendencia    → {"type":"line","labels":[...],"series":[{"name":"...","data":[n,...]}]}

Incluye siempre una breve explicación en español antes o después del JSON.
Si no aplica ninguna gráfica, responde normalmente en español sin incluir JSON.`;

function extractChart(text: string): ReportResponse | null {
  const start = text.indexOf(JSON_START);
  const end = text.indexOf(JSON_END);
  if (start === -1 || end === -1) return null;
  try {
    const raw = text.slice(start + JSON_START.length, end).trim();
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'type' in parsed && 'series' in parsed) {
      return parsed as ReportResponse;
    }
    return null;
  } catch {
    return null;
  }
}

function stripChart(text: string): string {
  const start = text.indexOf(JSON_START);
  const end = text.indexOf(JSON_END);
  if (start === -1 || end === -1) return text;
  return (text.slice(0, start) + text.slice(end + JSON_END.length)).trim();
}

/**
 * Sends chat turns to Groq (llama-3.3-70b-versatile). The API key is read from
 * the build-time environment — no UI, no localStorage. Parses chart JSON
 * embedded in the response with |||JSON|||...|||FIN||| delimiters.
 */
@Injectable({ providedIn: 'root' })
export class GroqChatService {
  private readonly typingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly chartSignal = signal<ReportResponse | null>(null);

  readonly isTyping = this.typingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly lastChart = this.chartSignal.asReadonly();
  readonly hasKey = environment.groqApiKey.trim() !== '';

  async sendMessage(history: readonly ChatMessage[]): Promise<ChatMessage | null> {
    if (!this.hasKey) {
      this.errorSignal.set('API Key de Groq no configurada. Edita src/environments/environment.ts.');
      return null;
    }

    this.typingSignal.set(true);
    this.errorSignal.set(null);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${environment.groqApiKey}`,
        },
        body: JSON.stringify({ model: GROQ_MODEL, messages }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(`Groq ${response.status}: ${detail}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const raw = data.choices[0]?.message?.content ?? '';

      this.chartSignal.set(extractChart(raw));

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: stripChart(raw),
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (error) {
      this.errorSignal.set(error instanceof Error ? error.message : 'Error al contactar Groq.');
      return null;
    } finally {
      this.typingSignal.set(false);
    }
  }
}
