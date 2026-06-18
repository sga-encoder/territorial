import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { Card, Container, EmptyState, ModalService, Spinner, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { AssignRoleDialog } from '../assign-role-dialog';
import { PendingUserService } from '../pending-user.service';

/** Admin panel: Firebase users without a backend role, awaiting classification. */
@Component({
  selector: 'app-pending-user-list',
  imports: [ReactiveFormsModule, Card, Container, EmptyState, Spinner, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './pending-user-list.html',
  styleUrl: './pending-user-list.scss',
})
export class PendingUserList {
  protected readonly service = inject(PendingUserService);
  private readonly modal = inject(ModalService);

  protected readonly selectionControl = new FormControl<readonly TableRow[]>([], { nonNullable: true });

  private readonly selection = toSignal(
    this.selectionControl.valueChanges.pipe(startWith([] as readonly TableRow[])),
    { initialValue: [] as readonly TableRow[] },
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.service.pending().map((user) => ({
      id: user.uid,
      name: user.displayName ?? '—',
      email: user.email,
      registeredAt: user.registeredAt,
    })),
  );

  // null = filter hasn't emitted yet → fall back to all rows (avoids empty-flash).
  private readonly filterOutput = signal<readonly TableRow[] | null>(null);
  protected readonly filteredRows = computed(() => this.filterOutput() ?? this.rows());

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Correo electrónico' },
    { key: 'registeredAt', header: 'Fecha de ingreso', type: 'date', typeConfig: { dateStyle: 'medium' } },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', matchMode: 'contains', placeholder: 'Buscar por nombre' },
      { key: 'email', label: 'Correo', type: 'text', matchMode: 'contains', placeholder: 'Buscar por correo' },
    ],
  };

  protected readonly headerActions = computed<readonly PageHeaderAction[]>(() => {
    const count = this.selection().length;
    return [
      {
        id: 'reload',
        label: 'Recargar',
        icon: 'save',
        variant: 'ghost' as const,
        loading: this.service.isLoading(),
        run: () => this.service.loadAll(),
      },
      {
        id: 'citizen',
        label: count > 0 ? `Ciudadano (${count})` : 'Como ciudadano',
        icon: 'user',
        disabled: count === 0,
        run: () => void this.assign('citizen'),
      },
      {
        id: 'official',
        label: count > 0 ? `Funcionario (${count})` : 'Como funcionario',
        icon: 'user',
        variant: 'secondary' as const,
        disabled: count === 0,
        run: () => void this.assign('official'),
      },
    ];
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.service.loadAll();
    }
  }

  protected onFiltered(rows: readonly TableRow[]): void {
    this.filterOutput.set(rows);
  }

  private async assign(role: 'citizen' | 'official'): Promise<void> {
    const selectedUids = new Set(this.selection().map((row) => String(row['id'])));
    const selectedUsers = this.service.pending().filter((u) => selectedUids.has(u.uid));
    if (selectedUsers.length === 0) return;

    const result = await this.modal.open(AssignRoleDialog, {
      title: role === 'citizen' ? 'Registrar como ciudadanos' : 'Registrar como funcionarios',
      size: 'md',
      inputs: { users: selectedUsers, role },
    });

    if (result === true) {
      this.selectionControl.setValue([]);
      this.service.loadAll();
    }
  }
}
