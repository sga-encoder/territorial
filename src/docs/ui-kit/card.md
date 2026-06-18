# Card — `<ui-card>`

Superficie de contenido. **Solid 3D mate** por defecto ("sólido donde se lee");
con `elevated` aplica la receta glass ("glass donde flota").

## Uso

```html
<ui-card>
  <ui-container ui-card-header justify="between" center="vertical">
    <ui-title [level]="5">Título</ui-title>
    <ui-badge variant="success" size="sm">activa</ui-badge>
  </ui-container>

  Cuerpo de la tarjeta (projection por defecto).

  <ui-container ui-card-footer justify="end" [gap]="2">
    <ui-button variant="ghost" size="sm">Cancelar</ui-button>
    <ui-button size="sm">Guardar</ui-button>
  </ui-container>
</ui-card>

<ui-card elevated>Variante glass…</ui-card>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `elevated` | `boolean` (atributo) | `false` | `false` = Solid 3D mate (gradiente + diferencial de bordes) · `true` = glass (blur + translucidez + highlight brillante). |
| `padded` | `boolean` (atributo) | `true` | Padding del **body**. `false` = contenido a sangre (mapas, media, tablas planas) que llena la superficie redondeada; header y footer conservan su padding. |

Slots por projection: atributo `ui-card-header`, contenido por defecto (body) y
atributo `ui-card-footer`. Header/footer colapsan solos si no se proyectan
(`empty:hidden`).

```html
<!-- Mapa a sangre dentro del marco redondeado del card -->
<ui-card [padded]="false">
  <div class="h-136"><app-polygon-map /></div>
</ui-card>
```

## Notas

- Nunca usar `elevated` dentro de listas largas o contenido repetido:
  `backdrop-filter` es costoso (regla de rendimiento del kit).
- Radio `lg` (18px) según la escala: cards usan `lg`, controles `md`.
