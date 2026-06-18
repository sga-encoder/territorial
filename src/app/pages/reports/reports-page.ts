import { Component, inject } from '@angular/core';
import { Card, Container, EmptyState, Spinner, Text } from '../../components/ui';
import { FormGenerator, PageHeader } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { ReportService } from './report.service';
import { ReportChart } from './report-chart';

/**
 * Reports panel (not a CRUD). A natural-language query is sent to POST /reports
 * and the `{ type, labels, series }` payload is rendered as a pie/bar/line chart
 * by <app-report-chart>. The query box uses the form generator (project RN-GEN:
 * every form is generator-driven).
 */
@Component({
  selector: 'app-reports-page',
  imports: [Card, Container, EmptyState, Spinner, Text, FormGenerator, PageHeader, ReportChart],
  template: `
    <ui-container direction="column" [gap]="6">
      <ui-page-header
        title="Reportes"
        subtitle="Consulta el territorio en lenguaje natural y obtén un gráfico generado por IA."
      />

      <ui-card>
        <ui-form-generator
          [schema]="schema"
          submitLabel="Generar reporte"
          (formSubmitted)="onSubmit($event)"
        />
      </ui-card>

      @if (reportService.error(); as errorMessage) {
        <ui-card>
          <ui-text color="danger">{{ errorMessage }}</ui-text>
        </ui-card>
      }

      @if (reportService.isLoading()) {
        <ui-card>
          <ui-container justify="center" [gap]="3" center="vertical">
            <ui-spinner size="md" />
            <ui-text color="muted">Generando reporte…</ui-text>
          </ui-container>
        </ui-card>
      } @else if (reportService.report(); as report) {
        <ui-card>
          <app-report-chart [report]="report" />
        </ui-card>
      } @else {
        <ui-card>
          <ui-empty-state
            icon="search"
            title="Sin reporte todavía"
            message="Escribe una consulta (por ejemplo, “comuna con más barrios”) y genera el gráfico."
          />
        </ui-card>
      }
    </ui-container>
  `,
})
export class ReportsPage {
  protected readonly reportService = inject(ReportService);

  /** Stable single-field schema (the query box). */
  protected readonly schema: FormSchema = [
    {
      title: 'Consulta',
      sections: [
        {
          fields: [
            {
              key: 'query',
              label: 'Consulta en lenguaje natural',
              type: 'textarea',
              span: 12,
              placeholder: 'Ej.: comuna con más barrios',
              validators: [{ type: 'required' }],
            },
          ],
        },
      ],
    },
  ];

  protected async onSubmit(value: FormValue): Promise<void> {
    await this.reportService.generate(value['query'] as string);
  }
}
