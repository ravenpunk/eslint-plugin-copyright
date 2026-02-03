import { copyrightRule } from './rules/copyright.js';

export default {
  meta: {
    name: 'eslint-plugin-copyright',
    version: '1.0.0',
  },
  rules: {
    notice: copyrightRule,
  },
};

export type { CopyrightOptions, MessageIds } from './rules/copyright.js';
