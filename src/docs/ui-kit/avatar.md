# Avatar — `<ui-avatar>`

Identidad visual de una persona: foto con fallback automático a iniciales
sobre tinte primario (cuando no hay `src` o la imagen falla al cargar).

## Uso

```html
<!-- Foto del usuario autenticado (AuthService.currentUser) -->
<ui-avatar [src]="user().photoUrl" initials="SG" alt="Sebastián Garzón" />

<!-- Avatar generado (DiceBear "dylan") a partir de una semilla determinista -->
<ui-avatar seed="sebastian.garzon" alt="Sebastián Garzón" />

<!-- Solo iniciales -->
<ui-avatar initials="MC" size="lg" />
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `src` | `string \| null` | `null` | URL de la foto; ante error de carga cae a iniciales. |
| `seed` | `string` | `''` | Si no hay `src`, genera un avatar **DiceBear "dylan"** vía HTTP API con el fondo en azules de la marca. |
| `initials` | `string` | `''` | Se renderizan en mayúsculas. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 32/40/56px. |
| `alt` | `string` | `''` | Nombre accesible; vacío = decorativo (hay un nombre visible al lado). |

## Notas

- DiceBear se consume por **API HTTP** (`api.dicebear.com/9.x/dylan/svg`), sin
  peso en el bundle. El `backgroundColor` se hornea con los azules de la marca
  (`4a8fe7,2d6ec7,7aaff0`), estables en ambos temas → el avatar es theme-blind.
- Precedencia de la imagen: `src` explícito → si no, `seed` (DiceBear) → si no
  hay ninguno o falla la carga, iniciales sobre tinte primario.

- En modo iniciales el texto queda `aria-hidden` y el nombre accesible (si se
  dio `alt`) se publica como `aria-label` del host.
- `// TODO:` reset del estado de error si `src` cambia tras un fallo de carga.
