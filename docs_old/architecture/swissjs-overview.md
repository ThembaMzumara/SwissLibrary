<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

SwissJS Documentation
Table of Contents

Introduction to SwissJS
Architecture Overview
Setting Up SwissJS
Components
VDOM System
State Management
Plugin System
Capability System
Renderer System
Getting Started
Best Practices
Advanced Topics


Introduction to SwissJS
SwissJS is a modern, capability-based web framework designed for building secure, extensible, and performant web applications. It leverages a unique security model, an extensible plugin system, and a virtual DOM (VDOM) for efficient rendering. SwissJS is ideal for developers who need strict security controls alongside flexibility and performance.
Key Features

Capability-based Security: Restricts access to resources based on explicit permissions.
Plugin System: Allows seamless extension of framework functionality.
Reactive State Management: Simplifies state handling with SwissStore.
Virtual DOM: Optimizes rendering by minimizing DOM updates.
Server-side Rendering (SSR): Enhances SEO and load times.
TypeScript Support: Ensures type safety and modern tooling.

Why SwissJS?
Compared to frameworks like React or Vue, SwissJS stands out with its built-in security model and extensibility, making it suitable for applications requiring high security and customization.

Architecture Overview
SwissJS is built on four interconnected subsystems:

CLI Toolchain: Manages project workflows (e.g., development server, builds).
Vite Integration Layer: Leverages Vite for fast development and optimized builds.
Swiss Compiler Pipeline: Transforms SwissJS syntax (.1ui files) into standard JavaScript.
Core Runtime Framework: Powers the runtime with components, VDOM, state, plugins, and rendering.

Diagram
graph TD
    CLI[CLI Toolchain] --> Vite[Vite Integration Layer]
    Vite --> Compiler[Swiss Compiler Pipeline]
    Compiler --> Runtime[Core Runtime Framework]
    Runtime --> App[Your Application]


Setting Up SwissJS
Installation

Install the SwissJS CLI:npm install -g swissjs-cli


Create a new project:swissjs create my-app
cd my-app


Install dependencies:npm install


Start the development server:swissjs dev



Project Structure
my-app/
├── src/
│   ├── main.1ui       # Entry point
│   └── App.1ui       # Main component
├── public/
│   └── index.html    # HTML template
├── package.json
├── tsconfig.json
└── vite.config.js


Components
Components are the core of SwissJS applications, defined as either class or functional components.
Defining Components

Class Component:

```tsx
import { component } from 'swissjs';

@component
class MyComponent {
  render() {
    return <div>Hello, SwissJS!</div>;
  }
}
```


Functional Component:

```tsx
function MyComponent() {
  return <div>Hello, SwissJS!</div>;
}
```



Lifecycle

Class: componentDidMount, componentDidUpdate, componentWillUnmount.
Functional: Use useEffect for lifecycle events.

Communication
Use props, context, or events:

```ts
this.emit('customEvent', data);
this.on('customEvent', (data) => { /* Handle data */ });
```


VDOM System
SwissJS uses a Virtual DOM to optimize rendering.
How It Works

A new VDOM tree is generated on state changes.
Differences are computed and applied to the real DOM.

Benefits

Reduced DOM manipulations for better performance.
Declarative rendering simplifies development.


State Management
SwissJS offers flexible state management options:

Local State:
```ts
const [count, setCount] = useState(0);
```

SwissStore (Global State):
```ts
import { createStore } from 'swissjs';
const store = createStore({ count: 0 });
store.setState((prev) => ({ count: prev.count + 1 }));
```

Context API:
```tsx
const ThemeContext = createContext('light');
<ThemeContext.Provider value="dark">
  <ChildComponent />
</ThemeContext.Provider>
```


Plugin System
Plugins extend SwissJS functionality.
Creating a Plugin
```ts
import { Plugin } from 'swissjs';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  capabilities = ['custom-capability'];
  initialize(context) { /* Setup */ }
  destroy() { /* Cleanup */ }
}
```

Registering a Plugin
```ts
import { PluginRegistry } from 'swissjs';
PluginRegistry.register('my-plugin', new MyPlugin());
```

Capability System
The capability system enforces security by requiring explicit permissions.
Declaring Capabilities
```ts
@requires(['network', 'storage'])
```
class DataFetcher {
  // Access granted to network and storage
}

Security Benefits

Prevents unauthorized access.
Enforced at compile-time and runtime.


Renderer System
The renderer translates VDOM changes into DOM updates.
How It Works

Computes minimal updates via diffing.
Applies changes efficiently with batching.

Customization
Developers can implement custom renderers for specific needs.

Getting Started
Simple Counter Example

Component:

```tsx
function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```


Render:

```tsx
import { render } from 'swissjs';
import App from './App.1ui';
render(<App />, document.getElementById('root'));
```


Run:

```bash
swissjs dev
```




Best Practices

Code: Use clear naming and modular components.
Performance: Minimize state updates, optimize assets.
Security: Leverage capabilities, validate inputs.


Advanced Topics

Custom Transformers: Extend the compiler pipeline.
Tool Integration: Combine with testing or build tools.
Contributing: Join the SwissJS community.


This documentation provides a complete guide to SwissJS. Explore further at the official SwissJS resources.