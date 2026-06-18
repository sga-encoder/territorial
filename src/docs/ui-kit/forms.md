# Formularios — visión general (Capa 4)

Siete controles con `ControlValueAccessor`: [InputText](input-text.md)
(text/email/**password**/**number**), [TextArea](textarea.md), [Select](select.md),
[Checkbox](checkbox.md), [Radio](radio.md), [Date](date.md) y [Range](range.md),
más **FileDrop** (carga por arrastrar y soltar, no CVA — emite `File[]`). Los campos de texto,
Select y Date tienen tres estados (`controlStateClasses(hasError, filled)`):
**reposo** = se funden con el fondo, definidos SOLO por el borde (sin relleno,
blur ni sombra); **hover** = reaccionan como un Button (se elevan con un glow de
color); **activo (foco)** = cavidad glass translúcida con blur + hundido +
anillo; y al tener datos pasan a **Solid 3D**. La legibilidad AA se mantiene con
texto `foreground`.

## Label flotante

Cuando un control (InputText, TextArea, Select, Date) recibe `label`, esta actúa
como **placeholder dentro del campo** en reposo y **flota ARRIBA, por fuera** del
input al enfocar o cuando hay contenido (lo gestiona `FieldShell` con
`:focus-within` + un input `filled`; se reserva espacio arriba con `pt-5`). Al
activarse, si el campo está vacío se muestra el **placeholder real** dentro
(oculto en reposo para no competir con la label). Sin `label`, el control usa su
`placeholder` normal.

`FileDrop` y `Range` usan **label estática** (arriba, no flotante: `staticLabel`)
porque no tienen un "interior" tipo placeholder. Checkbox y Radio conservan su
label propio.

## Iconos y agrupación

- **Iconos:** `InputText` acepta `iconStart` y/o `iconEnd` (decorativos,
  `pointer-events:none`); `Select` acepta `iconStart`. El padding se ajusta solo
  para que el texto no quede bajo el icono.
- **Password:** `type="password"` añade un botón de ojo a la derecha que alterna
  la visibilidad (`aria-pressed`, cambia el `type` renderizado).
- **Number:** `type="number"`.
- **Agrupar campos sin separación:** envolver controles en `<ui-field-group>`
  (inputs y/o selects). Colapsa esquinas y bordes adyacentes (estilos globales
  `.ui-field-group` en `styles.scss`, que alcanzan el `<input>`/trigger interno);
  el control enfocado sube de capa para que su anillo no quede recortado.

```html
<ui-input label="Usuario" iconStart="user" iconEnd="check" />
<ui-input type="password" label="Contraseña" />
<ui-input type="number" label="Puntos" />

<ui-field-group>
  <ui-input placeholder="Mínimo" />
  <ui-input placeholder="Máximo" />
</ui-field-group>
```

## Controles seleccionables, Date y archivos

- **Checkbox / Radio:** el control nativo se conserva (oculto, `peer`) por
  accesibilidad, pero el visual es **propio** con tokens: caja/anillo glass que
  pasan a primario al activarse, con un **check/punto que aparece con rebote**,
  **halo al pasar el cursor** y anillo de foco — todo vía variantes `peer-*`.
- **Range:** slider personalizado por CSS global (`input[type='range']`): pista
  redondeada + pulgar Solid 3D que **crece al arrastrar** (active) y muestra
  **halo en hover/foco**.
- **Date:** calendario glass **totalmente personalizado** (el popup nativo no se
  puede tematizar) — trigger como los demás controles + panel con navegación de
  mes y cuadrícula de días; valor ISO `'yyyy-MM-dd'` (CVA sin cambios).
- **FileDrop:** zona de arrastrar y soltar (o clic/teclado) con vista previa en
  miniatura para imágenes. `accept="image/*"` → solo imágenes; `multiple` para
  varios. Emite `filesChange: File[]`.

```html
<ui-file-drop label="Documentos" multiple (filesChange)="onFiles($event)" />
<ui-file-drop label="Imágenes" accept="image/*" multiple (filesChange)="onFiles($event)" />
```

## Arquitectura compartida (`components/ui/forms/`)

| Pieza | Rol |
| --- | --- |
| `FormFieldControl<T>` | Base abstracta CVA: `value` y `disabled` como signals, `commitValue()` para cambios del usuario, `markTouched()` en blur, normalización de `null` (reset) al valor vacío del control. |
| `FieldShell` | Chrome interno (label arriba, control, error abajo) con ids `for`/`aria-describedby` cableados. No se exporta. |
| `fieldErrorMessage()` | Única función que decide **cuándo y qué** error mostrar (RN-UI-07). |

## RN-UI-07 — Errores solo tras enviar

Los campos permanecen en silencio hasta el primer intento de envío; después
el mensaje se corrige en vivo. El consumidor mantiene un signal `submitted`:

```ts
protected readonly submitted = signal(false);

protected errorOf(control: AbstractControl): string | null {
  return fieldErrorMessage(control, this.submitted());
}

protected onSubmit(): void {
  this.submitted.set(true);
  if (this.form.valid) { /* … */ }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <ui-input formControlName="name" label="Nombre" [error]="errorOf(form.controls.name)" />
  <ui-button type="submit">Enviar</ui-button>
</form>
```

Mensajes por defecto en español (`required`, `email`, `minlength`,
`maxlength`, `min`, `max`, `pattern`) con overrides por validador:

```ts
fieldErrorMessage(control, submitted, { required: 'Debes aceptar los términos.' });
```

## Accesibilidad común

- `label[for]` + ids únicos por instancia; error enlazado con
  `aria-describedby` y `aria-invalid` en el control.
- Checkbox y Radio conservan el `<input>` **nativo** (oculto con `peer`): el
  teclado y los lectores de pantalla siguen funcionando; el visual personalizado
  es decorativo y refleja el estado con `peer-checked` / `peer-focus-visible`.
- Todas las animaciones (rebote del check/punto, halos, pulgar del range)
  respetan `prefers-reduced-motion`.
- Demo completa en `/ui-kit` (sección Formularios) con un FormGroup real.
