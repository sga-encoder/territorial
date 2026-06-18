import { Component, inject, signal } from '@angular/core';
import { Badge, Card, Container, Icon, Text } from '../../components/ui';
import { Chatbot, PageHeader } from '../../components/dynamic';
import type { ChatMessage } from '../../components/dynamic/types';
import { ReportChart } from './report-chart';
import { GroqChatService } from './groq-chat.service';

/**
 * CU-15 — Natural-language report chat powered by Groq.
 * User writes a question; the assistant replies with prose + optional chart JSON.
 * API key must be set in src/environments/environment.ts (groqApiKey field).
 */
@Component({
  selector: 'app-reports-chat',
  imports: [Badge, Card, Container, Icon, Text, Chatbot, PageHeader, ReportChart],
  template: `
    <ui-container direction="column" [gap]="6">
      <ui-page-header
        title="Chat de reportes"
        subtitle="Consulta el territorio en lenguaje natural (CU-15). El asistente genera gráficas automáticamente."
      />

      @if (!groq.hasKey) {
        <ui-card>
          <ui-container center="vertical" [gap]="3">
            <ui-icon name="alert-circle" size="md" color="warning" />
            <ui-container direction="column" [gap]="1">
              <ui-text weight="semibold">API Key no configurada</ui-text>
              <ui-text variant="caption" color="muted">
                Abre <strong>src/environments/environment.ts</strong> y pega tu clave Groq en el
                campo <code>groqApiKey</code>.
              </ui-text>
            </ui-container>
          </ui-container>
        </ui-card>
      }

      @if (groq.error(); as errorMessage) {
        <ui-card>
          <ui-container center="vertical" [gap]="2">
            <ui-icon name="alert-circle" size="sm" color="danger" />
            <ui-text color="danger">{{ errorMessage }}</ui-text>
          </ui-container>
        </ui-card>
      }

      <ui-chatbot
        title="Asistente territorial"
        subtitle="Groq · llama-3.3-70b"
        placeholder="Ej.: ¿Cuántos barrios tiene cada comuna?"
        [messages]="messages()"
        [typing]="groq.isTyping()"
        [disabled]="!groq.hasKey"
        (messageSent)="onMessageSent($event)"
      />

      @if (groq.lastChart(); as chart) {
        <ui-card>
          <ui-container direction="column" [gap]="3">
            <ui-container center="vertical" [gap]="2">
              <ui-icon name="bar-chart-2" size="sm" color="primary" />
              <ui-text variant="label">Visualización generada</ui-text>
              <ui-badge variant="primary">{{ chart.type }}</ui-badge>
            </ui-container>
            <app-report-chart [report]="chart" />
          </ui-container>
        </ui-card>
      }
    </ui-container>
  `,
})
export class ReportsChatPage {
  protected readonly groq = inject(GroqChatService);

  protected readonly messages = signal<readonly ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola, soy tu asistente territorial. Pregúntame sobre barrios, comunas, departamentos o cualquier estadística del sistema. Cuando necesites una gráfica, te la genero automáticamente.',
    },
  ]);

  protected async onMessageSent(text: string): Promise<void> {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };
    this.messages.update((prev) => [...prev, userMessage]);

    const reply = await this.groq.sendMessage(this.messages().slice(-20));
    if (reply !== null) {
      this.messages.update((prev) => [...prev, reply]);
    }
  }
}
