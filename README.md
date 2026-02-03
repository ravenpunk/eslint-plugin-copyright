# eslint-plugin-copyright

Are you tired of plugins that treat TypeScript like a second-class citizen? Or perhaps you're a stylish, modern best-practice 10x web developer embracing ESLint's flat config only to find your copyright plugin is stuck in 2023?

Worry not my weary friend for at last you've stumbled upon **eslint-plugin-copyright** - a plugin with types that actually work and first-class flat config support that won't make you question your life choices.

Because in 2026, your copyright plugin should be at least as modern as the javascript framework released last week which you've just adopted for a complete rewrite.

## Features

- Ensure copyright notices are the first line in files (no whitespace or other comments above)
- Works with JavaScript, TypeScript, and CSS files using appropriate comment styles (`//` for JS/TS, `/* */` for CSS)
- Automatically updates copyright year to the current year when outdated
- Configurable copyright text with year placeholder (YYYY)
- Configurable number of newlines after the copyright comment
- Compatible with both ESLint flat config and traditional config formats
- Built with TypeScript for full type definitions

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

| Option       | Type     | Required | Default                         | Description                                                                    |
| ------------ | -------- | -------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `template`   | string   | Yes      | `'Copyright © YYYY'`           | The copyright text template. Use `YYYY` as a placeholder for the current year. |
| `newlines`   | number   | No       | `2`                             | Number of newlines to append after the copyright comment.                      |
| `extensions` | string[] | No       | `['js','jsx','ts','tsx','css']` | File extensions to check (without leading dot).                                |

### ESLint Flat Config (recommended)

```ts
// eslint.config.ts
import copyright from 'eslint-plugin-copyright';

export default [
  {
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
];
```

### Legacy ESLint Config

```js
// .eslintrc.js
module.exports = {
  plugins: ['copyright'],
  rules: {
    'copyright/notice': [
      'error',
      {
        template: 'Copyright © YYYY InvestInMyAI LLC. All rights reserved.',
        newlines: 2,
      },
    ],
  },
};
```

## License

MIT
