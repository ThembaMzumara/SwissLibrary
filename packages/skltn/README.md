# @swissjs/skltn

**Swiss Skeleton** - The foundational UI framework for Swiss Enterprise applications.

## What is SKLTN?

SKLTN provides the "operating system" layer for enterprise frontends:
- **Shell Architecture** - Sidebar, TopBar, TabBar, ModuleHost
- **Module System** - Dynamic plugin architecture
- **Design System** - Tokens, primitives, layouts
- **State Management** - Capabilities, event bus

## Installation

```bash
pnpm add @swissjs/skltn
```

## Quick Start

```ui
<!-- App.ui -->
<component name="App">
  <script>
    import { Shell } from '@swissjs/skltn';
    import { MODULE_MANIFEST } from './modules';
  </script>
  
  <template>
    <Shell 
      modules={MODULE_MANIFEST}
      theme="dark"
    />
  </template>
</component>
```

## Documentation

- [SKLTN Overview](../../docs/specifications/skltn/README.md)
- [Design Tokens](../../docs/specifications/skltn/design-tokens.md)
- [Module Development](../../docs/specifications/skltn/module-development.md)

## Package Structure

```
src/
├── shell/          # Shell components
├── components/     # Reusable primitives
├── layouts/        # Layout components
├── tokens/         # Design tokens (CSS)
├── providers/      # Infrastructure (TS)
└── index.ui        # Main export
```

## License

MIT © Themba Mzumara
