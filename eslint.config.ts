// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPrettier from 'eslint-config-prettier/flat';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import type { Linter } from 'eslint';

export default tseslint.config(
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // prettier configuration (must be last to override other configs)
  eslintPrettier
) as readonly Linter.Config[];
