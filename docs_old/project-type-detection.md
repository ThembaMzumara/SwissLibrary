<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Project Type Detection Strategy

## 1. Primary Detection Method: `swissjs.type` Field

```json
{
  "name": "my-project",
  "swissjs": {
    "type": "component" | "library" | "plugin"
  }
}
```

## 2. Secondary Detection: Package.json Indicators

### **Component Indicators**
```json
{
  "name": "my-awesome-component",
  "scripts": {
    "dev": "swissjs dev",
    "build": "swissjs build",
    "serve": "swissjs serve"
  },
  "dependencies": {
    "@swissjs/core": "^1.0.0"
  },
  "swissjs": {
    "type": "component",
    "entry": "src/main.ts",
    "public": "public"
  }
}
```

**Key Indicators:**
- Has `dev` and `serve` scripts
- Usually has a `public` folder reference
- Entry point is typically `main.ts` or `index.ts`
- Can have `homepage` field for deployment

### **Library Indicators**
```json
{
  "name": "@myorg/swiss-ui-library",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "swissjs build",
    "test": "swissjs test"
  },
  "peerDependencies": {
    "@swissjs/core": "^1.0.0"
  },
  "swissjs": {
    "type": "library",
    "entry": "src/index.ts",
    "exports": {
      "./components": "./dist/components/index.js",
      "./utils": "./dist/utils/index.js"
    }
  }
}
```

**Key Indicators:**
- Has `main`, `module`, and `types` fields
- Uses `peerDependencies` instead of `dependencies` for SwissJS
- Has `files` array specifying what to publish
- Usually scoped package name (`@org/name`)
- No `dev` or `serve` scripts

### **Plugin Indicators**
```json
{
  "name": "@swissjs/plugin-router",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "keywords": [
    "swissjs-plugin",
    "router"
  ],
  "scripts": {
    "build": "swissjs build",
    "test": "swissjs test"
  },
  "peerDependencies": {
    "@swissjs/core": "^1.0.0"
  },
  "swissjs": {
    "type": "plugin",
    "entry": "src/index.ts",
    "plugin": {
      "name": "router",
      "install": "auto",
      "config": {
        "routes": "./routes"
      }
    }
  }
}
```

**Key Indicators:**
- Contains `swissjs-plugin` in keywords
- Usually named with `plugin-` prefix
- Has plugin-specific configuration in `swissjs.plugin`
- Uses `peerDependencies` for SwissJS
- Often has `install` method specification

## 3. Folder Structure Detection (Fallback)

### **Component Structure**
```
my-component/
├── src/
│   ├── main.ts          # Entry point
│   ├── components/      # UI components
│   └── styles/          # Styles
├── public/              # Static assets
│   ├── index.html       # Main HTML
│   └── assets/          # Images, fonts, etc.
├── dist/                # Build output
└── package.json
```

### **Library Structure**
```
my-library/
├── src/
│   ├── index.ts         # Main export
│   ├── components/      # Reusable components
│   ├── utils/           # Utility functions
│   └── types/           # Type definitions
├── test/                # Test component
│   ├── src/
│   └── public/
├── dist/                # Build output
└── package.json
```

### **Plugin Structure**
```
my-plugin/
├── src/
│   ├── index.ts         # Plugin entry
│   ├── install.ts       # Installation logic
│   └── types.ts         # Plugin types
├── example/             # Example usage
│   ├── src/
│   └── public/
├── dist/                # Build output
└── package.json
```

## 4. Detection Algorithm

```typescript
function detectProjectType(packageJson: any, projectRoot: string): 'component' | 'library' | 'plugin' {
  // 1. Check explicit type declaration
  if (packageJson.swissjs?.type) {
    return packageJson.swissjs.type;
  }

  // 2. Check package.json indicators
  const hasMainModule = packageJson.main || packageJson.module;
  const hasPublicFolder = fs.existsSync(path.join(projectRoot, 'public'));
  const hasDevScript = packageJson.scripts?.dev;
  const hasServeScript = packageJson.scripts?.serve;
  const hasPeerDeps = packageJson.peerDependencies?.['@swissjs/core'];
  const hasPluginKeyword = packageJson.keywords?.includes('swissjs-plugin');
  const isScoped = packageJson.name?.startsWith('@');

  // Plugin detection
  if (hasPluginKeyword || packageJson.name?.includes('plugin-')) {
    return 'plugin';
  }

  // Library detection
  if (hasMainModule && hasPeerDeps && !hasPublicFolder && !hasDevScript) {
    return 'library';
  }

  // Component detection (default)
  if (hasPublicFolder || hasDevScript || hasServeScript) {
    return 'component';
  }

  // Default fallback
  return 'component';
}
```

## 5. Build Configuration Per Type

### **Component Build Config**
```json
{
  "swissjs": {
    "type": "component",
    "build": {
      "entry": "src/main.ts",
      "outDir": "dist",
      "publicDir": "public",
      "assets": true,
      "html": true
    }
  }
}
```

### **Library Build Config**
```json
{
  "swissjs": {
    "type": "library",
    "build": {
      "entry": "src/index.ts",
      "outDir": "dist",
      "formats": ["cjs", "esm"],
      "declaration": true,
      "external": ["@swissjs/core"]
    }
  }
}
```

### **Plugin Build Config**
```json
{
  "swissjs": {
    "type": "plugin",
    "build": {
      "entry": "src/index.ts",
      "outDir": "dist",
      "format": "cjs",
      "declaration": true,
      "external": ["@swissjs/core"]
    },
    "plugin": {
      "name": "my-plugin",
      "install": "manual"
    }
  }
}
```

## 6. Testing Strategy Per Type

### **Component Testing**
- Direct: `swissjs dev` or `swissjs serve`
- Built-in development server
- Hot module replacement

### **Library Testing**
- Create `test/` or `example/` folder with a component
- Build library first: `swissjs build`
- Link locally: `npm link` or use file: protocol
- Run test component: `cd test && swissjs dev`

### **Plugin Testing**
- Create `example/` folder with a component that uses the plugin
- Build plugin first: `swissjs build`
- Install plugin in example: `npm install file:../`
- Run example component: `cd example && swissjs dev`

## 7. Command Behavior Per Type

| Command | Component | Library | Plugin |
|---------|-----------|---------|---------|
| `swissjs dev` | ✅ Dev server | ❌ Error: Use test folder | ❌ Error: Use example folder |
| `swissjs build` | ✅ Full build | ✅ Library build | ✅ Plugin build |
| `swissjs serve` | ✅ Serve dist | ❌ Error: Not applicable | ❌ Error: Not applicable |
| `swissjs test` | ✅ Run tests | ✅ Build & test in test/ | ✅ Build & test in example/ |

## 8. Error Messages & Guidance

```typescript
// For libraries/plugins trying to run dev
console.error(chalk.red('❌ Cannot run dev server for library projects'));
console.log(chalk.yellow('💡 To test your library:'));
console.log(chalk.white('  1. Create a test component: mkdir test && cd test'));
console.log(chalk.white('  2. Initialize: swissjs create test-component'));
console.log(chalk.white('  3. Install your library: npm install file:../'));
console.log(chalk.white('  4. Run dev server: swissjs dev'));
```

This approach provides clear project type detection with multiple fallback mechanisms and appropriate build strategies for each type. 