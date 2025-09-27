<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Benchmarking Criteria

SwissJS is designed for minimalism, security, performance, and extensibility. Our benchmarks ensure we meet these goals and remain competitive with frameworks like React, Vue, and Svelte.

## Performance
| Package         | Metric                  | Target/Threshold         | Tool         |
|-----------------|------------------------|--------------------------|--------------|
| core            | render() ops/sec        | > 10,000 ops/sec         | vitest bench |
| compiler        | parse() time            | < 5ms per 1k lines       | vitest bench |
| vite-plugin     | transform() time        | < 10ms per file          | vitest bench |
| plugins/router  | route resolution time   | < 1ms per op             | vitest bench |

- **Initial Load Time**: <100ms (simple app) — measured with Lighthouse
- **Bundle Size**: <50KB for core — measured with build scripts

## Developer Experience (DX)
- **Setup Time**: <5 min (using CLI)
- **Code Conciseness**: 20% fewer LOC than React for common features
- **Debugging Steps**: <5 steps for common bugs
- **Documentation Quality**: >4/5 in developer surveys

## Security
- **Capability Enforcement**: 100% unauthorized access blocked (custom tests)
- **Data Exposure**: 0 leaks (OWASP ZAP)
- **EIS API Compliance**: 100% (integration tests)

## Extensibility
- **Plugin Integration Time**: <1 hour
- **Plugin Overhead**: <10KB per plugin

## Ecosystem
- **Plugins**: 5+ by v1.0
- **Community**: tracked via GitHub metrics

## How to Run Benchmarks
- In each package: `pnpm run benchmark`
- See `/bench` or `/__benchmarks__` for scripts
- Results are published in CI and summarized here

## Comparison
- We regularly compare SwissJS to React, Vue, and Svelte using equivalent features and public benchmarks. 