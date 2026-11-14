<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Contributing to SwissJS

Thank you for your interest in contributing to SwissJS! We welcome contributions from the community to help make this framework better.

## Getting Started

1.  **Read the Code of Conduct**: Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community standards.
2.  **Check the Development Guide**: Our detailed [Development Guidelines](docs/DEVELOPMENT.md) cover everything you need to know about:
    *   Setting up your environment
    *   Coding standards (Linting, TypeScript)
    *   Testing requirements
    *   Commit message conventions (`[SWS-AREA-ID] Description`)
    *   Branching strategy (`develop` -> `staging` -> `main`)

## How to Contribute

1.  **Fork the repository** and clone it locally.
2.  **Create a branch** from `develop` for your feature or fix.
3.  **Make your changes**, ensuring you follow the [Quality Standards](docs/DEVELOPMENT.md#quality-standards).
4.  **Run checks** locally:
    ```bash
    pnpm lint
    pnpm type-check
    pnpm test
    ```
5.  **Commit your changes** using our conventional commit format.
6.  **Push to your fork** and submit a Pull Request to the `develop` branch.

## Pull Request Process

*   **Target Branch**: All PRs should target `develop`.
*   **CI Checks**: Your PR must pass all CI checks (Lint, Test, Security, etc.).
*   **Documentation**: If you change code, you must update the relevant documentation. Our `verify-docs-sync` script will check this.
*   **Review**: A maintainer will review your PR. Please address any feedback promptly.

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub. Provide as much detail as possible, including reproduction steps for bugs.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
