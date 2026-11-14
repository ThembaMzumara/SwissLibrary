<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Observable Signal & Effect System

## Overview

SwissJS provides a robust, fine-grained reactivity system based on observable signals and effects. This system enables highly efficient, composable, and secure state management for modern UI development.

---

## Key Concepts

- **Signal**: A standalone observable value that notifies subscribers on change.
- **Computed Signal**: A derived value that automatically tracks dependencies and updates when they change.
- **Effect**: A reactive side effect that automatically re-executes when any of its dependencies (signals) change.
- **Cleanup**: Effects can register cleanup logic to run before re-execution or disposal.
- **Batching**: Multiple updates can be batched to minimize redundant notifications.
- **Security/Capabilities**: Signals can be protected by capability checks for secure state access.

---

## API Reference

### Signal

```ts
import { signal } from '../reactivity/signals';

const count = signal(0);

count.value = 1;
count.subscribe(() => console.log('Count changed!'));
```

#### Methods
- `signal(initialValue, options?)`: Create a new signal.
- `signal.value`: Get/set the current value.
- `signal.update(fn)`: Update value using a function.
- `signal.subscribe(fn)`: Subscribe to changes.
- `signal.unsubscribe(fn)`: Unsubscribe from changes.

#### Options
- `equals`: Custom equality function.
- `name`: Debug-friendly name.
- `capability`: Security capability string.

---

### Computed Signal

```ts
import { computed } from '../reactivity/signals';

const double = computed(() => count.value * 2);
console.log(double.value); // 2
```

#### Methods
- `computed(fn, options?)`: Create a computed signal.
- `computedSignal.value`: Get the current computed value.

---

### Effect

```ts
import { effect, onCleanup } from '../reactivity/effect';

effect(() => {
  console.log(`Count is: ${count.value}`);
  onCleanup(() => console.log('Cleanup before next run or dispose'));
});
```

#### Methods
- `effect(fn)`: Create a reactive effect. Returns a dispose function.
- `onCleanup(fn)`: Register cleanup logic for the current effect.

---

### Batching

```ts
import { batch } from '../reactivity/batch';

batch(() => {
  count.value = 2;
  count.value = 3;
  // Only one notification is sent
});
```

---

### Store

```ts
import { createStore } from '../reactivity/store';

const userStore = createStore({
  name: 'Alice',
  age: 30
});

userStore.update({ name: 'Bob' });
userStore.derive('greeting', state => `Hello, ${state.name}!`);
```

---

### DOM Integration

```ts
import { bindToElement } from '../reactivity/signals';

const input = document.createElement('input');
bindToElement(input, 'value', count, { twoWay: true });
```

---

## Usage Examples

### Basic Signal and Effect

```ts
const count = signal(0);
effect(() => {
  console.log('Count:', count.value);
});
count.value = 1; // Logs: Count: 1
```

### Computed Signal

```ts
const count = signal(2);
const double = computed(() => count.value * 2);
effect(() => {
  console.log('Double:', double.value);
});
count.value = 3; // Logs: Double: 6
```

### Effect with Cleanup

```ts
const timerSignal = signal(0);
effect(() => {
  const timer = setInterval(() => {
    timerSignal.value++;
  }, 1000);
  onCleanup(() => clearInterval(timer));
});
```

### Secure Signal with Capabilities

```ts
const secret = signal('top-secret', { capability: 'read:secret' });

// Only accessible within a security context
withSecurityContext(['read:secret'], () => {
  console.log(secret.value); // Allowed
});
```

---

## Best Practices
- Use signals for all reactive state.
- Use computed signals for derived values.
- Always clean up side effects in effects using `onCleanup`.
- Use batching for performance when updating multiple signals.
- Use capabilities to secure sensitive signals.

---

## Advanced Topics
- **Nested Effects**: Effects can be nested; context is managed automatically.
- **Memory Safety**: Effects and signals automatically unsubscribe and clean up.
- **Integration**: Use DOM helpers for seamless UI binding.

---

## FAQ

**Q: How is this different from React state/hooks?**
A: Signals are fine-grained, standalone observables. Effects automatically track dependencies, and updates are synchronous and batched for performance. No virtual DOM diffing is needed for signal-driven updates.

**Q: Can I use signals in components?**
A: Yes! Signals are designed to be used anywhere, including in components, stores, and DOM bindings.

**Q: How do I prevent memory leaks?**
A: Always use the dispose function returned by `effect`, and use `onCleanup` for side effects.

---

## References
- `signals.ts`, `effect.ts`, `batch.ts`, `store.ts`, `context.ts`, `integration.ts`
- [SwissJS Documentation](./) 