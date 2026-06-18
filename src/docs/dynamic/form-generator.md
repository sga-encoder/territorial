# Form Generator — `<ui-form-generator>`

Construye un Reactive Form a partir de un **schema de metadatos**: un
`FormGroup` plano (una clave por campo) renderizado página por página (wizard),
con grid de 12 columnas por sección. Cada campo se pinta con
`<ui-dynamic-input>`, que despacha al control CVA del kit correspondiente.

## Uso

```ts
protected readonly schema: FormSchema = [
  {
    title: 'Datos generales',
    sections: [
      {
        title: 'Identificación',
        fields: [
          { key: 'name', label: 'Nombre', type: 'text', span: 6,
            validators: [{ type: 'required' }, { type: 'minLength', value: 3 }] },
          { key: 'email', label: 'Correo', type: 'email', span: 6,
            validators: [{ type: 'required' }, { type: 'email' }] },
        ],
      },
    ],
  },
  {
    title: 'Preferencias',
    sections: [
      {
        fields: [
          { key: 'wantsNotifications', label: 'Recibir notificaciones', type: 'checkbox' },
          { key: 'notificationEmail', label: 'Correo de avisos', type: 'email', span: 6,
            conditionalVisibility: { fieldKey: 'wantsNotifications', equals: true },
            validators: [{ type: 'required' }, { type: 'email' }] },
        ],
      },
    ],
  },
];
```

```html
<ui-form-generator
  [schema]="schema"
  submitLabel="Registrar"
  (formSubmitted)="onSubmit($event)"
  (formChanged)="onChange($event)"
/>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `schema` | `FormSchema` (requerido) | — | Array de páginas. Pasa una **referencia estable**. |
| `submitLabel` | `string` | `'Enviar'` | Texto del botón final. |

| Output | Tipo | Cuándo |
| --- | --- | --- |
| `formChanged` | `FormValue` | En cada cambio de valor. |
| `formSubmitted` | `FormValue` | Al enviar **solo si el formulario es válido**. |

## Schema

- **`FormFieldType`:** `text` · `email` · `password` · `textarea` · `select` ·
  `checkbox` · `radio` · `date` · `range` · `file` · `location` · `hidden`. Cada uno
  mapea a un control del kit (`hidden` mantiene el control sin pintarlo).
- **`location` (selección en mapa):** renderiza `<ui-map-point-picker>` (búsqueda
  por dirección + pin arrastrable sobre el mapa temable). El **valor es un string
  `"lat,lng"`**; el consumidor lo parte con `.split(',').map(Number)` en
  `formSubmitted`. `initialValue` (editar): `` `${lat},${lng}` ``. Es **pesado**
  (MapLibre): se carga con `@defer`, así solo los formularios con un campo
  `location` traen el motor. Ver [map-point-picker.md](../map-point-picker.md).
  Ejemplo real: `pages/citizens/citizen-form-dialog.ts` (RN-10).
- **`file` (subida de archivos):** renderiza `<ui-file-drop>` (drag & drop). Como
  `FileDrop` no es CVA, el generador refleja su `filesChange` en el control: el
  **valor es `File[]`** (array vacío si no hay selección, por eso `required`
  funciona). Config: `accept` (p. ej. `'image/*'`), `multiple`, `hint`. El
  consumidor decide qué hacer con los `File[]` en `formSubmitted` (subir, derivar
  un nombre, etc.). Ejemplo real: el logo en `pages/entities/entity-form-dialog.ts`.
- **`validators`:** unión discriminada y tipada (sin `any`): `required`,
  `requiredTrue`, `email`, `min`/`max`/`minLength`/`maxLength`/`pattern` (estos
  con `value`). `messages` permite overrides por validador (RN-UI-07).
- **`span` (`1|2|3|4|6|12`):** ancho del campo en el grid de 12. Semántico — el
  componente lo traduce a clases; nunca pasas Tailwind. Móvil siempre apila.
- **`conditionalVisibility { fieldKey, equals }`:** el campo se muestra solo
  cuando otro campo iguala `equals`. Mientras está oculto, su control se
  **deshabilita** (sale de la validez y del valor).
- **`select`/`radio`** usan `options: FieldOption[]`; **`range`** usa
  `min`/`max`/`step`.

## Notas

- **Enlace de controles:** cada campo se enlaza con `[formControl]` (instancia
  explícita) en vez de `formControlName`, para no acoplar el `ControlContainer`
  al cruzar el límite de `<ui-dynamic-input>`.
- **Errores (RN-UI-07):** silencio hasta el primer intento de envío/«Siguiente»;
  después se corrigen en vivo. «Siguiente» valida la página actual antes de avanzar.
- **Schema estable:** un array nuevo en cada CD reconstruye el `FormGroup` y
  reinicia el wizard; expón el schema como un campo `readonly`.
