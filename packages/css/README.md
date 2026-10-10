# @swissjs/css

CSS and asset handling for the Swiss framework.

## Features

- **CSS Modules** - Scoped CSS with automatic class name generation
- **Asset Imports** - Import images, fonts, and other assets in `.ui`/`.uix` files
- **Build Optimizations** - Minification, critical CSS, fingerprinting
- **Developer Experience** - TypeScript types, HMR support

## Status

🚧 **In Development** - Phase 1: CSS Strategy

## Installation

```bash
pnpm add @swissjs/css
```

## Usage

### CSS Modules in Components

```ui
<component name="Button">
  <style module>
    .button {
      padding: 1rem 2rem;
      background: blue;
    }
  </style>
  
  <template>
    <button :class="$style.button">
      <slot />
    </button>
  </template>
</component>
```

### Asset Imports

```ui
<component name="Logo">
  <script>
    import logo from './assets/logo.png';
  </script>
  
  <template>
    <img :src="logo" alt="Logo" />
  </template>
</component>
```

## Documentation

See [FEATURE-css-assets.md](../../docs/features/FEATURE-css-assets.md) for full documentation.

## License

MIT © Themba Mzumara
