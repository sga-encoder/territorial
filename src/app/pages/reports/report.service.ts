import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportResponse } from '../../models/report.model';

// The reports endpoint lives at the API root — NOT under /api — so it does not
// use BaseRepository (spec.md §3 prefix does not apply here).
const REPORTS_URL = `${environment.baseUrl}/reports`;

const GENERATE_ERROR_MESSAGE =
  'No fue posible generar el reporte. Revisa la consulta o el estado del backend.';

/** State (signals) + orchestration for the AI-generated Reports panel. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  private readonly reportSignal = signal<ReportResponse | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly report = this.reportSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /** POST /reports — natural-language query in, chart payload out. */
  async generate(query: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<ReportResponse>(REPORTS_URL, { query }),
      );
      this.reportSignal.set(response);
    } catch {
      this.reportSignal.set(null);
      this.errorSignal.set(GENERATE_ERROR_MESSAGE);
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
