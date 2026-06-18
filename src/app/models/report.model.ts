/** Chart kinds the /reports endpoint can return. */
export type ReportChartType = 'pie' | 'bar' | 'line';

/** A named data series for cartesian charts (bar/line). */
export interface ReportSeries {
  readonly name: string;
  readonly data: readonly number[];
}

/** Pie response: one flat number per label. */
export interface PieReport {
  readonly type: 'pie';
  readonly labels: readonly string[];
  readonly series: readonly number[];
}

/** Bar/line response: one or more named series aligned to `labels`. */
export interface CartesianReport {
  readonly type: 'bar' | 'line';
  readonly labels: readonly string[];
  readonly series: readonly ReportSeries[];
}

/**
 * Discriminated union of the /reports payload. `type` selects the renderer and
 * the `series` shape (pie = number[], bar/line = ReportSeries[]).
 */
export type ReportResponse = PieReport | CartesianReport;
