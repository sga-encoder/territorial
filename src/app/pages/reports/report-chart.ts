import { Component, computed, input } from '@angular/core';
import { Container, Text } from '../../components/ui';
import type { CartesianReport, PieReport, ReportResponse } from '../../models/report.model';

/** Theme-token palette, cycled when there are more slices/series than colors. */
const PALETTE: readonly string[] = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info)',
];

// Cartesian (bar/line) plot geometry.
const WIDTH = 640;
const HEIGHT = 320;
const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 34;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

// Pie geometry.
const PIE_CX = 120;
const PIE_CY = 120;
const PIE_R = 100;

interface PieSlice {
  readonly path: string;
  readonly color: string;
  readonly label: string;
  readonly value: number;
  readonly percent: string;
}
interface Bar {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color: string;
}
interface AxisLabel {
  readonly x: number;
  readonly text: string;
}
interface LinePath {
  readonly points: string;
  readonly color: string;
  readonly dots: readonly { readonly cx: number; readonly cy: number }[];
}
interface LegendEntry {
  readonly color: string;
  readonly label: string;
}

/** Dependency-free SVG renderer for the /reports payload (pie · bar · line). */
@Component({
  selector: 'app-report-chart',
  imports: [Container, Text],
  template: `
    @switch (report().type) {
      @case ('pie') {
        <ui-container direction="row" [gap]="6" center="vertical" wrap>
          <svg viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Gráfico circular">
            @if (pieIsSingle()) {
              <circle [attr.cx]="PIE_CX" [attr.cy]="PIE_CY" [attr.r]="PIE_R" [style.fill]="pieSlices()[0].color" />
            } @else {
              @for (slice of pieSlices(); track slice.label) {
                <path [attr.d]="slice.path" [style.fill]="slice.color" stroke="var(--color-surface)" stroke-width="1" />
              }
            }
          </svg>
          <ui-container direction="column" [gap]="2">
            @for (slice of pieSlices(); track slice.label) {
              <ui-container direction="row" [gap]="2" center="vertical">
                <span class="inline-block h-3 w-3 rounded-sm" [style.background]="slice.color"></span>
                <ui-text variant="caption">{{ slice.label }} — {{ slice.value }} ({{ slice.percent }})</ui-text>
              </ui-container>
            }
          </ui-container>
        </ui-container>
      }
      @default {
        <ui-container direction="column" [gap]="3">
          <svg [attr.viewBox]="viewBox" width="100%" [attr.height]="HEIGHT" role="img" aria-label="Gráfico de datos">
            <!-- Axes -->
            <line [attr.x1]="PAD_LEFT" [attr.y1]="PAD_TOP" [attr.x2]="PAD_LEFT" [attr.y2]="baselineY" stroke="var(--color-border)" />
            <line [attr.x1]="PAD_LEFT" [attr.y1]="baselineY" [attr.x2]="plotRight" [attr.y2]="baselineY" stroke="var(--color-border)" />

            @if (report().type === 'bar') {
              @for (bar of bars(); track $index) {
                <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h" rx="2" [style.fill]="bar.color" />
              }
            } @else {
              @for (line of linePaths(); track $index) {
                <polyline [attr.points]="line.points" fill="none" [style.stroke]="line.color" stroke-width="2" />
                @for (dot of line.dots; track $index) {
                  <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="3" [style.fill]="line.color" />
                }
              }
            }

            <!-- X labels -->
            @for (axisLabel of axisLabels(); track $index) {
              <text [attr.x]="axisLabel.x" [attr.y]="HEIGHT - 12" text-anchor="middle" font-size="11" fill="var(--color-foreground-muted)">
                {{ axisLabel.text }}
              </text>
            }
          </svg>

          <ui-container direction="row" [gap]="4" wrap>
            @for (entry of legend(); track entry.label) {
              <ui-container direction="row" [gap]="2" center="vertical">
                <span class="inline-block h-3 w-3 rounded-sm" [style.background]="entry.color"></span>
                <ui-text variant="caption">{{ entry.label }}</ui-text>
              </ui-container>
            }
          </ui-container>
        </ui-container>
      }
    }
  `,
})
export class ReportChart {
  readonly report = input.required<ReportResponse>();

  protected readonly PIE_CX = PIE_CX;
  protected readonly PIE_CY = PIE_CY;
  protected readonly PIE_R = PIE_R;
  protected readonly PAD_LEFT = PAD_LEFT;
  protected readonly PAD_TOP = PAD_TOP;
  protected readonly HEIGHT = HEIGHT;
  protected readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  protected readonly baselineY = PAD_TOP + PLOT_H;
  protected readonly plotRight = PAD_LEFT + PLOT_W;

  private color(index: number): string {
    return PALETTE[index % PALETTE.length];
  }

  // --- Pie ------------------------------------------------------------------
  private readonly pie = computed<PieReport | null>(() => {
    const report = this.report();
    return report.type === 'pie' ? report : null;
  });

  /** A single non-zero value renders as a full circle (arcs can't close 360°). */
  protected readonly pieIsSingle = computed(() => {
    const pie = this.pie();
    return pie !== null && pie.series.filter((value) => value > 0).length <= 1;
  });

  protected readonly pieSlices = computed<readonly PieSlice[]>(() => {
    const pie = this.pie();
    if (pie === null) {
      return [];
    }
    const total = pie.series.reduce((sum, value) => sum + value, 0) || 1;
    let angle = -90;
    return pie.series.map((value, index) => {
      const sweep = (value / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return {
        path: this.arcPath(start, end),
        color: this.color(index),
        label: pie.labels[index] ?? `Serie ${index + 1}`,
        value,
        percent: `${Math.round((value / total) * 100)}%`,
      };
    });
  });

  private arcPath(startDeg: number, endDeg: number): string {
    const start = this.polar(startDeg);
    const end = this.polar(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${PIE_CX} ${PIE_CY} L ${start.x} ${start.y} A ${PIE_R} ${PIE_R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  private polar(angleDeg: number): { x: number; y: number } {
    const radians = (angleDeg * Math.PI) / 180;
    return { x: PIE_CX + PIE_R * Math.cos(radians), y: PIE_CY + PIE_R * Math.sin(radians) };
  }

  // --- Cartesian (bar/line) -------------------------------------------------
  private readonly cartesian = computed<CartesianReport | null>(() => {
    const report = this.report();
    return report.type === 'bar' || report.type === 'line' ? report : null;
  });

  private readonly maxValue = computed(() => {
    const report = this.cartesian();
    if (report === null) {
      return 1;
    }
    const values = report.series.flatMap((serie) => serie.data);
    return Math.max(1, ...values);
  });

  protected readonly axisLabels = computed<readonly AxisLabel[]>(() => {
    const report = this.cartesian();
    if (report === null) {
      return [];
    }
    const step = PLOT_W / report.labels.length;
    return report.labels.map((text, index) => ({ x: PAD_LEFT + step * (index + 0.5), text }));
  });

  protected readonly bars = computed<readonly Bar[]>(() => {
    const report = this.cartesian();
    if (report === null) {
      return [];
    }
    const max = this.maxValue();
    const groupWidth = PLOT_W / report.labels.length;
    const seriesCount = Math.max(1, report.series.length);
    const barWidth = (groupWidth * 0.7) / seriesCount;
    const bars: Bar[] = [];
    report.labels.forEach((_, labelIndex) => {
      report.series.forEach((serie, seriesIndex) => {
        const value = serie.data[labelIndex] ?? 0;
        const height = (value / max) * PLOT_H;
        bars.push({
          x: PAD_LEFT + groupWidth * labelIndex + groupWidth * 0.15 + barWidth * seriesIndex,
          y: PAD_TOP + PLOT_H - height,
          w: barWidth,
          h: height,
          color: this.color(seriesIndex),
        });
      });
    });
    return bars;
  });

  protected readonly linePaths = computed<readonly LinePath[]>(() => {
    const report = this.cartesian();
    if (report === null) {
      return [];
    }
    const max = this.maxValue();
    const denominator = Math.max(1, report.labels.length - 1);
    const step = PLOT_W / denominator;
    return report.series.map((serie, seriesIndex) => {
      const dots = report.labels.map((_, labelIndex) => {
        const value = serie.data[labelIndex] ?? 0;
        return {
          cx: PAD_LEFT + step * labelIndex,
          cy: PAD_TOP + PLOT_H - (value / max) * PLOT_H,
        };
      });
      return {
        points: dots.map((dot) => `${dot.cx},${dot.cy}`).join(' '),
        color: this.color(seriesIndex),
        dots,
      };
    });
  });

  protected readonly legend = computed<readonly LegendEntry[]>(() => {
    const report = this.cartesian();
    if (report === null) {
      return [];
    }
    return report.series.map((serie, index) => ({ color: this.color(index), label: serie.name }));
  });
}
