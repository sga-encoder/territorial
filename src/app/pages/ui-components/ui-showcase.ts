import { Component, computed, DOCUMENT, inject, signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  DateField,
  Divider,
  Dropdown,
  EmptyState,
  FieldGroup,
  fieldErrorMessage,
  FileDrop,
  Icon,
  ICON_NAMES,
  InputText,
  ModalService,
  Pagination,
  Radio,
  Range,
  Select,
  Spinner,
  Table,
  TableCellDef,
  TabPanelDef,
  Tabs,
  Text,
  TextArea,
  ThemeService,
  Title,
  ToastService,
  Toggle,
  Tooltip,
} from '../../components/ui';
import { DemoModal } from './demo-modal';
import type {
  BadgeVariant,
  BreadcrumbItem,
  DropdownItem,
  FieldErrorMessages,
  FieldOption,
  TabItem,
  TableColumn,
  TableRow,
} from '../../components/ui';
import { Chatbot, DynamicTable, Filter, FormGenerator } from '../../components/dynamic';
import { GlassStage, ParticlesBackground } from '../../components/visual';
import type {
  ChatMessage,
  DynamicColumn,
  DynamicRowAction,
  DynamicSelectionValue,
  FilterConfig,
  FormSchema,
  FormValue,
} from '../../components/dynamic';

interface ShowcaseSectionLink {
  readonly id: string;
  readonly label: string;
}
interface ShowcaseIndexGroup {
  readonly layer: string;
  readonly sections: readonly ShowcaseSectionLink[];
}

/**
 * UI Kit showcase (Capa 6): living documentation and sustentación piece.
 * One section per component organized by layers, internal index navigation,
 * live theme toggle, a real FormGroup and Modal/Toast triggers. Atomic
 * principle: built EXCLUSIVELY with UI Kit components — the only bare
 * elements are unstyled semantic landmarks (header/section/form). Usage code
 * samples live in src/docs/ui-kit/ (RN-UI-05: no CodeBlock component).
 */
@Component({
  selector: 'app-ui-showcase',
  imports: [
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Checkbox,
    Chip,
    Container,
    DateField,
    Divider,
    Dropdown,
    EmptyState,
    FieldGroup,
    FileDrop,
    Icon,
    InputText,
    Pagination,
    Radio,
    Range,
    ReactiveFormsModule,
    Select,
    Spinner,
    Table,
    TableCellDef,
    TabPanelDef,
    Tabs,
    Text,
    TextArea,
    Title,
    Toggle,
    Tooltip,
    Chatbot,
    DynamicTable,
    Filter,
    FormGenerator,
    GlassStage,
    ParticlesBackground,
  ],
  templateUrl: './ui-showcase.html',
})
export class UiShowcase {
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);
  private readonly document = inject(DOCUMENT);
  protected readonly iconNames = ICON_NAMES;

  // Capa 6 — internal navigation: one entry per section, grouped by layer.
  protected readonly sectionIndex: readonly ShowcaseIndexGroup[] = [
    {
      layer: 'Capa 1',
      sections: [
        { id: 'container', label: 'Container' },
        { id: 'text', label: 'Text' },
        { id: 'title', label: 'Title' },
        { id: 'divider', label: 'Divider' },
      ],
    },
    {
      layer: 'Capa 2',
      sections: [
        { id: 'button', label: 'Button' },
        { id: 'icon', label: 'Icon' },
        { id: 'spinner', label: 'Spinner' },
        { id: 'avatar', label: 'Avatar' },
        { id: 'toggle', label: 'Toggle' },
      ],
    },
    {
      layer: 'Capa 3',
      sections: [
        { id: 'card', label: 'Card' },
        { id: 'badge', label: 'Badge' },
        { id: 'chip', label: 'Chip' },
        { id: 'breadcrumbs', label: 'Breadcrumbs' },
        { id: 'table', label: 'Table' },
        { id: 'pagination', label: 'Pagination' },
        { id: 'empty-state', label: 'Empty State' },
        { id: 'tabs', label: 'Tabs' },
      ],
    },
    {
      layer: 'Capa 4',
      sections: [{ id: 'forms', label: 'Formularios (7 controles)' }],
    },
    {
      layer: 'Capa 5',
      sections: [
        { id: 'modal', label: 'Modal' },
        { id: 'toast', label: 'Toast' },
        { id: 'tooltip', label: 'Tooltip' },
        { id: 'dropdown', label: 'Dropdown' },
      ],
    },
    {
      layer: 'Capa dynamic',
      sections: [
        { id: 'filter', label: 'Filter' },
        { id: 'dynamic-table', label: 'Dynamic Table' },
        { id: 'form-generator', label: 'Form Generator' },
        { id: 'chatbot', label: 'Chatbot' },
      ],
    },
    {
      layer: 'Capa visual',
      sections: [{ id: 'particles', label: 'Particles Background' }],
    },
  ];

  protected scrollToSection(sectionId: string): void {
    const section = this.document.getElementById(sectionId);
    if (section === null) {
      return;
    }
    const reducedMotion =
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
    section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  protected readonly demoBreadcrumbs: readonly BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Entidades', path: '/entities' },
    { label: 'Alcaldía de Manizales' },
  ];

  protected readonly demoColumns: readonly TableColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'city', header: 'Ciudad' },
    { key: 'status', header: 'Estado', align: 'center' },
    { key: 'points', header: 'Puntos', align: 'right' },
  ];
  protected readonly demoRows: readonly TableRow[] = [
    { name: 'Alcaldía de Manizales', city: 'Manizales', status: 'activa', points: 128 },
    { name: 'Gobernación de Caldas', city: 'Manizales', status: 'pendiente', points: 64 },
    { name: 'Secretaría de Ambiente', city: 'Villamaría', status: 'inactiva', points: 12 },
  ];

  protected readonly demoTabs: readonly TabItem[] = [
    { id: 'general', label: 'General', icon: 'info' },
    { id: 'map', label: 'Mapa', icon: 'map-pin' },
    { id: 'history', label: 'Historial', icon: 'calendar', disabled: true },
  ];

  // Interactive demos: controlled pagination + removable chips.
  protected readonly demoPage = signal(3);
  protected readonly demoChips = signal<readonly string[]>([
    'Ambiente',
    'Vías',
    'Salud pública',
    'Cultura',
  ]);

  // Capa 4 — real FormGroup proving every CVA control (RN-UI-07: errors only
  // appear after the first submit attempt, then update live).
  protected readonly cityOptions: readonly FieldOption[] = [
    { value: 'manizales', label: 'Manizales' },
    { value: 'villamaria', label: 'Villamaría' },
    { value: 'chinchina', label: 'Chinchiná' },
    { value: 'neira', label: 'Neira', disabled: true },
  ];
  protected readonly roleOptions: readonly FieldOption[] = [
    { value: 'citizen', label: 'Ciudadano' },
    { value: 'official', label: 'Funcionario' },
    { value: 'admin', label: 'Administrador', disabled: true },
  ];
  private readonly termsMessages: FieldErrorMessages = {
    required: 'Debes aceptar los términos para continuar.',
  };

  protected readonly demoForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    city: new FormControl<string | null>(null, Validators.required),
    role: new FormControl<string | null>(null, Validators.required),
    visitDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl(50, { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });
  protected readonly formSubmitted = signal(false);
  protected readonly lastSubmission = signal<string | null>(null);

  // Disabled state demo: the form (not the template) owns the disabled flag,
  // and the controls reflect it through setDisabledState (CVA contract).
  protected readonly disabledInput = new FormControl(
    { value: 'Solo lectura', disabled: true },
    { nonNullable: true },
  );
  protected readonly disabledCheckbox = new FormControl(
    { value: true, disabled: true },
    { nonNullable: true },
  );

  protected statusVariant(row: TableRow): BadgeVariant {
    switch (row['status']) {
      case 'activa':
        return 'success';
      case 'pendiente':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected removeChip(chipLabel: string): void {
    this.demoChips.update((chips) => chips.filter((chip) => chip !== chipLabel));
  }

  protected resetChips(): void {
    this.demoChips.set(['Ambiente', 'Vías', 'Salud pública', 'Cultura']);
  }

  protected errorOf(control: AbstractControl, overrides?: FieldErrorMessages): string | null {
    return fieldErrorMessage(control, this.formSubmitted(), overrides);
  }

  protected termsError(): string | null {
    return this.errorOf(this.demoForm.controls.terms, this.termsMessages);
  }

  protected onDemoSubmit(): void {
    this.formSubmitted.set(true);
    if (this.demoForm.valid) {
      this.lastSubmission.set(JSON.stringify(this.demoForm.getRawValue(), null, 1));
    } else {
      this.lastSubmission.set(null);
    }
  }

  protected resetDemoForm(): void {
    this.demoForm.reset();
    this.formSubmitted.set(false);
    this.lastSubmission.set(null);
  }

  // Capa 5 — overlays.
  protected readonly lastModalResult = signal<string | null>(null);

  protected readonly dropdownActions: readonly DropdownItem[] = [
    { value: 'view', label: 'Ver detalle', icon: 'eye' },
    { value: 'edit', label: 'Editar', icon: 'edit' },
    { value: 'delete', label: 'Eliminar', icon: 'trash', danger: true },
  ];
  protected readonly lastDropdownAction = signal<string | null>(null);
  protected onDropdownAction(value: string): void {
    this.lastDropdownAction.set(value);
    this.toast.info(`Acción seleccionada: ${value}`);
  }

  protected onFilesSelected(files: readonly File[]): void {
    this.toast.info(`${files.length} archivo(s) seleccionado(s)`);
  }

  protected readonly toggleDemo = signal(true);
  protected readonly notifyDemo = signal(false);

  protected async openDemoModal(): Promise<void> {
    const result = await this.modal.open(DemoModal, { title: 'Archivar entidad', size: 'sm' });
    if (result === true) {
      this.lastModalResult.set('Confirmado');
      this.toast.success('Entidad archivada correctamente');
    } else if (result === false) {
      this.lastModalResult.set('Cancelado');
    } else {
      this.lastModalResult.set('Cerrado sin elegir (ESC o backdrop)');
    }
  }

  // --- Capa dynamic — Dynamic Table ---
  protected readonly dynamicColumns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Entidad' },
    { key: 'city', header: 'Ciudad' },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      type: 'badge',
      typeConfig: {
        badgeVariants: { activa: 'success', pendiente: 'warning', inactiva: 'neutral' },
      },
    },
    {
      key: 'category',
      header: 'Categoría',
      type: 'chip',
      typeConfig: { chipVariants: { Ambiente: 'success', Vías: 'info', Salud: 'danger' } },
    },
    { key: 'createdAt', header: 'Registro', type: 'date', typeConfig: { dateStyle: 'medium' } },
    { key: 'points', header: 'Puntos', align: 'right', type: 'number' },
    { key: 'verified', header: 'Verificada', align: 'center', type: 'boolean' },
  ];
  protected readonly dynamicRows: readonly TableRow[] = [
    { id: 1, name: 'Alcaldía de Manizales', city: 'Manizales', status: 'activa', category: 'Ambiente', createdAt: '2026-01-15', points: 128, verified: true },
    { id: 2, name: 'Gobernación de Caldas', city: 'Manizales', status: 'pendiente', category: 'Vías', createdAt: '2026-02-03', points: 64, verified: false },
    { id: 3, name: 'Secretaría de Ambiente', city: 'Villamaría', status: 'inactiva', category: 'Ambiente', createdAt: '2025-11-20', points: 12, verified: false },
    { id: 4, name: 'Hospital Departamental', city: 'Manizales', status: 'activa', category: 'Salud', createdAt: '2026-03-10', points: 210, verified: true },
    { id: 5, name: 'Universidad de Caldas', city: 'Manizales', status: 'activa', category: 'Ambiente', createdAt: '2026-01-28', points: 175, verified: true },
    { id: 6, name: 'Empresa de Aseo', city: 'Chinchiná', status: 'pendiente', category: 'Vías', createdAt: '2026-02-19', points: 48, verified: false },
    { id: 7, name: 'Bomberos Voluntarios', city: 'Neira', status: 'activa', category: 'Salud', createdAt: '2025-12-05', points: 92, verified: true },
  ];
  protected readonly tableActions: readonly DynamicRowAction[] = [
    {
      id: 'edit',
      icon: 'edit',
      label: 'Editar',
      color: 'info',
      run: (row) => this.toast.info(`Editar ${String(row['name'])}`),
    },
    {
      id: 'delete',
      icon: 'trash',
      label: 'Eliminar',
      color: 'danger',
      run: (row) => this.toast.warning(`Eliminar ${String(row['name'])}`),
    },
  ];
  protected readonly tableSelection = signal<DynamicSelectionValue>(null);
  protected readonly tableSelectionCount = computed(() => {
    const value = this.tableSelection();
    if (value === null) {
      return 0;
    }
    return Array.isArray(value) ? value.length : 1;
  });
  protected onTableSelection(value: DynamicSelectionValue): void {
    this.tableSelection.set(value);
  }

  // --- Capa dynamic — Filter ---
  protected readonly demoFilterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar', type: 'text', placeholder: 'Nombre de la entidad', matchMode: 'contains' },
      {
        key: 'city',
        label: 'Ciudad',
        type: 'select',
        matchMode: 'equals',
        options: [
          { value: 'Manizales', label: 'Manizales' },
          { value: 'Villamaría', label: 'Villamaría' },
          { value: 'Chinchiná', label: 'Chinchiná' },
          { value: 'Neira', label: 'Neira' },
        ],
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        matchMode: 'equals',
        options: [
          { value: 'activa', label: 'Activa' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'inactiva', label: 'Inactiva' },
        ],
      },
    ],
  };
  protected readonly filteredDynamicRows = signal<readonly TableRow[]>([]);
  protected onDemoFiltered(rows: readonly TableRow[]): void {
    this.filteredDynamicRows.set(rows);
  }

  // --- Capa dynamic — Form Generator ---
  protected readonly formSchema: FormSchema = [
    {
      title: 'Datos generales',
      description: 'Identificación de la entidad (CU-01).',
      sections: [
        {
          title: 'Identificación',
          fields: [
            { key: 'name', label: 'Nombre', type: 'text', span: 6, placeholder: 'Razón social', validators: [{ type: 'required' }, { type: 'minLength', value: 3 }] },
            { key: 'nit', label: 'NIT', type: 'text', span: 6, validators: [{ type: 'required' }] },
            { key: 'entityType', label: 'Tipo', type: 'select', span: 6, options: [{ value: 'public', label: 'Pública' }, { value: 'private', label: 'Privada' }], validators: [{ type: 'required' }] },
            { key: 'email', label: 'Correo', type: 'email', span: 6, validators: [{ type: 'required' }, { type: 'email' }] },
          ],
        },
        {
          title: 'Descripción',
          fields: [
            { key: 'description', label: 'Descripción', type: 'textarea', span: 12, placeholder: 'Caracterización breve de la entidad' },
          ],
        },
      ],
    },
    {
      title: 'Preferencias',
      description: 'Notificaciones y consentimiento.',
      sections: [
        {
          fields: [
            { key: 'wantsNotifications', label: 'Quiero recibir notificaciones', type: 'checkbox', span: 12 },
            { key: 'notificationEmail', label: 'Correo de notificaciones', type: 'email', span: 6, conditionalVisibility: { fieldKey: 'wantsNotifications', equals: true }, validators: [{ type: 'required' }, { type: 'email' }] },
            { key: 'priority', label: 'Prioridad', type: 'range', span: 6, min: 0, max: 100, step: 10 },
            { key: 'role', label: 'Rol principal', type: 'radio', span: 12, options: [{ value: 'citizen', label: 'Ciudadano' }, { value: 'official', label: 'Funcionario' }], validators: [{ type: 'required' }] },
            { key: 'terms', label: 'Acepto los términos y el tratamiento de datos', type: 'checkbox', span: 12, validators: [{ type: 'requiredTrue' }], messages: { required: 'Debes aceptar los términos para continuar.' } },
          ],
        },
      ],
    },
  ];
  protected readonly generatedSubmission = signal<string | null>(null);
  protected onGeneratedSubmit(value: FormValue): void {
    this.generatedSubmission.set(JSON.stringify(value, null, 1));
    this.toast.success('Formulario generado enviado');
  }

  // --- Capa dynamic — Chatbot ---
  protected readonly chatMessages = signal<readonly ChatMessage[]>([
    { id: 'm1', role: 'assistant', content: '¡Hola! Soy el asistente territorial. ¿En qué te ayudo hoy?' },
  ]);
  protected readonly chatTyping = signal(false);
  private chatCounter = 1;
  protected onChatSend(text: string): void {
    const userMessage: ChatMessage = { id: `u${++this.chatCounter}`, role: 'user', content: text };
    this.chatMessages.update((list) => [...list, userMessage]);
    this.chatTyping.set(true);
    setTimeout(() => {
      this.chatTyping.set(false);
      const reply: ChatMessage = {
        id: `a${++this.chatCounter}`,
        role: 'assistant',
        content: `Recibí: "${text}". (Respuesta simulada — aquí se conectaría el backend de IA.)`,
      };
      this.chatMessages.update((list) => [...list, reply]);
    }, 900);
  }
}
