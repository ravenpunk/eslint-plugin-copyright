# eslint-plugin-copyright

Are you tired of plugins that treat TypeScript like a second-class citizen? Or perhaps you're a stylish, modern best-practice 10x web developer embracing ESLint's flat config only to find your copyright plugin is stuck in 2023?

Worry not my weary friend for at last you've stumbled upon **eslint-plugin-copyright** - a plugin with types that actually work and first-class flat config support that won't make you question your life choices.

Because in 2026, your copyright plugin should be at least as modern as the javascript framework released last week which you've just adopted for a complete rewrite.

What's that I hear, your repository might be a little rusty? You're in luck! We even ship a tiny Rust parser whose sole life purpose is to ~~pass the butter~~, err I mean slap a copyright header on `.rs` files. Wasm is the future after all.

## Features

- Ensure copyright notices are the first line in files (no whitespace or other comments above)
- Works with JavaScript, TypeScript, and CSS files by default using appropriate comment styles (`//` for JS/TS, `/* */` for CSS)
- Automatically updates copyright year to the current year when outdated
- Configurable copyright text with year placeholder (YYYY)
- Configurable file globs via ESLint config (recommended)
- Configurable number of newlines after the copyright comment
- Detects and auto-fixes duplicate copyright notices at the top of files
- Compatible with both ESLint flat config and traditional config formats
- Built with TypeScript for full type definitions
- Includes a barebones Rust parser to add/fix copyright notices in `.rs` files

## Installation

```bash
# Using pnpm
pnpm add -D eslint-plugin-copyright

# Or if your taste is more questionable...

# Using npm
npm install eslint-plugin-copyright --save-dev

# Using yarn
yarn add eslint-plugin-copyright --dev
```

## Usage

### Configuration Options

| Option       | Type     | Required | Default              | Description                                                                                       |
| ------------ | -------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `template`   | string   | Yes      | `'Copyright © YYYY'` | The copyright text template. Use `YYYY` as a placeholder for the current year.                    |
| `newlines`   | number   | No       | `2`                  | Number of newlines to append after the copyright comment.                                         |
| `extensions` | string[] | No       | —                    | Optional allow-list of extensions to check (without leading dot). Prefer `files` globs in config. |

### ESLint Flat Config (recommended)

```ts
// eslint.config.ts
import copyright, { rustParser } from 'eslint-plugin-copyright';
import css from '@eslint/css';

export default [
  {
    // Prefer ESLint's file globs over per-rule extension filtering
    files: ['**/*.{js,jsx,ts,tsx,d.ts}'],
    plugins: {
      copyright,
    },
    rules: {
      'copyright/notice': [
        'error',
        {
          template: 'Copyright © YYYY YetAnotherAI, Inc. All rights reserved.',
          newlines: 2,
        },
      ],
    },
  },
  {
    files: ['**/*.css'],
    plugins: { css, copyright },
    language: 'css/css',
    rules: {
      'copyright/notice': [
        'error',
        { template: 'Copyright © YYYY YetAnotherAI, Inc. All rights reserved.', newlines: 1 },
      ],
    },
  },
  {
    files: ['**/*.rs'],
    plugins: { copyright },
    // This parser exists only to make header checking/fixing work on Rust files.
    // It does not lint Rust semantics.
    languageOptions: { parser: rustParser },
    rules: {
      'copyright/notice': [
        'error',
        { template: 'Copyright © YYYY YetAnotherAI, Inc. All rights reserved.', newlines: 2 },
      ],
    },
  },
];
```

### Legacy ESLint Config

```js
// .eslintrc.js
module.exports = {
  plugins: ['copyright'],
  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx,d.ts}'],
      rules: {
        'copyright/notice': [
          'error',
          { template: 'Copyright © YYYY InvestInMyAI LLC. All rights reserved.', newlines: 2 },
        ],
      },
    },
  ],
};
```

## License

MIT
