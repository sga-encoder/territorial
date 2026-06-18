# FileDrop — `<ui-file-drop>`

Carga de archivos por **arrastrar y soltar** (o clic / teclado, que abren el
diálogo nativo). Las imágenes muestran **miniatura de vista previa**; el resto,
un chip con el nombre. No es un control CVA (los `File` no serializan en el valor
del formulario): emite `filesChange` con el `File[]` actual.

## Uso

```html
<!-- Archivos e imágenes -->
<ui-file-drop label="Documentos" multiple hint="Arrastra o haz clic"
  (filesChange)="onFiles($event)" />

<!-- Solo imágenes (con vista previa) -->
<ui-file-drop label="Imágenes" accept="image/*" multiple
  (filesChange)="onFiles($event)" />
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `label` | `string` | `''` | |
| `accept` | `string` | `''` | Filtro MIME/extensión; `image/*` activa el modo solo-imágenes. |
| `multiple` | `boolean` (atributo) | `false` | Permite varios archivos. |
| `disabled` | `boolean` (atributo) | `false` | |
| `hint` | `string` | `''` | Línea de ayuda bajo el texto. |
| `error` | `string \| null` | `null` | |

| Output | Payload |
| --- | --- |
| `filesChange` | `readonly File[]` |

## Notas

- La zona reacciona al arrastrar (borde primario + tinte + leve escala) y al
  hover; se enfoca por teclado (el `<input>` real va oculto pero accesible) y el
  anillo de foco aparece en la zona vía `peer-focus-visible`.
- En imágenes se generan object URLs para la miniatura y se **revocan** al
  cambiar la selección y al destruir el componente (sin fugas de memoria).
- Cada archivo se puede quitar con su botón ✕ (emite el `File[]` actualizado).
