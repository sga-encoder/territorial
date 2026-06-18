# Chatbot — `<ui-chatbot>`

Superficie conversacional **presentacional**: renderiza una lista de mensajes y
emite el texto que el usuario envía. No contiene lógica de IA ni estado de la
conversación — el consumidor decide quién responde (backend, IA o un mock).

## Uso

```ts
protected readonly messages = signal<readonly ChatMessage[]>([
  { id: 'm1', role: 'assistant', content: '¡Hola! ¿En qué te ayudo?' },
]);
protected readonly typing = signal(false);

protected onSend(text: string): void {
  this.messages.update((list) => [...list, { id: crypto.randomUUID(), role: 'user', content: text }]);
  this.typing.set(true);
  // …pide la respuesta al backend/IA y luego:
  // this.typing.set(false);
  // this.messages.update((list) => [...list, assistantMessage]);
}
```

```html
<ui-chatbot
  [messages]="messages()"
  [typing]="typing()"
  title="Asistente Territorial"
  (messageSent)="onSend($event)"
/>
```

## API

| Input | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `messages` | `readonly ChatMessage[]` | `[]` | `{ id, role: 'user' \| 'assistant', content, timestamp? }`. |
| `typing` | `boolean` | `false` | Muestra el indicador de tres puntos. |
| `title` | `string` | `'Asistente'` | Nombre en la cabecera. |
| `subtitle` | `string` | `'En línea'` | Estado bajo el título (se sustituye por «Escribiendo…»). |
| `placeholder` | `string` | `'Escribe un mensaje…'` | Del campo de entrada. |
| `assistantInitials` / `userInitials` | `string` | `'IA'` / `'Tú'` | Fallback de avatar. |
| `assistantAvatar` / `userAvatar` | `string \| null` | `null` | URL de foto (si no, iniciales). |
| `disabled` | `boolean` | `false` | Bloquea el envío. |

| Output | Tipo | Cuándo |
| --- | --- | --- |
| `messageSent` | `string` | Al enviar (Enter o botón); se limpia el campo. |

## Notas

- **Glass donde flota, sólido donde se lee:** burbujas glass para el asistente,
  sólidas (`primary-strong`) para el usuario. Sin `backdrop-filter` en las
  burbujas (contenido repetido) — el tinte ya lee como glass.
- **Auto-scroll SSR-safe:** mantiene el último mensaje a la vista con un `effect`
  + `requestAnimationFrame`, solo en navegador.
- **Altura:** fija en `32rem` (el panel se autocontiene). Parametrizable más
  adelante si una pantalla lo necesita.
- **Accesibilidad:** el hilo es un `role="log"` con `aria-live="polite"`; el
  composer es un `<form>` (Enter envía) con campo etiquetado.
- **Sin ícono `send`:** el botón usa texto «Enviar» para no ampliar el set de
  íconos del kit (RN-UI-06). Añadir un ícono `send` es una decisión aparte.
