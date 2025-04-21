import { copyrightRule } from './rules/copyright.js';

export default {
  meta: {
    name: 'eslint-copyright-plugin',
    version: '1.0.0',
  },
  rules: {
    notice: copyrightRule,
  },
};

export type { CopyrightOptions, MessageIds } from './rules/copyright.js';
