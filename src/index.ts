import { copyrightRule } from './rules/copyright.js';
import type { ESLint } from 'eslint';

import { rustParser } from './parsers/rust.js';

const plugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-copyright',
    version: '1.2.1',
  },
  rules: {
    notice: copyrightRule,
  },
};

export default plugin;

export type { CopyrightOptions, MessageIds } from './rules/copyright.js';
export { rustParser };
