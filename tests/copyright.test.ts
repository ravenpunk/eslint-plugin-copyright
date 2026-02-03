import { afterAll, describe, it, vi } from 'vitest';
import { RuleTester } from 'eslint';
import { copyrightRule } from '../src/rules/copyright.js';
import tsParser from '@typescript-eslint/parser';
import css from '@eslint/css';

vi.useFakeTimers();
// Use mid-day UTC to avoid local timezone rolling back into 2025.
vi.setSystemTime(new Date(Date.UTC(2026, 0, 2, 12, 0, 0)));
afterAll(() => {
  vi.useRealTimers();
});

export class VitestRuleTester extends RuleTester {
  static describe(name: string, fn: () => void) {
    describe(name, fn);
  }
  static it(name: string, fn: () => void) {
    it(name, fn);
  }
  static itOnly(name: string, fn: () => void) {
    it.only(name, fn);
  }
}

// Configure rule tester
const ruleTester = new VitestRuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});
const cssTester = new VitestRuleTester({
  plugins: { css },
  language: 'css/css',
});

ruleTester.run('copyright (TS)', copyrightRule, {
  valid: [
    // Valid JavaScript file with correct copyright
    {
      code: '// Copyright © 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
    // Valid TypeScript file with correct copyright
    {
      code: '// Copyright © 2026\nconst foo: string = "bar";',
      filename: 'file.ts',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
    // Custom copyright text
    {
      code: '// Copyright (c) ACME Corp 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright (c) ACME Corp YYYY', newlines: 1 }],
    },
    // Multiple newlines after copyright
    {
      code: '// Copyright © 2026\n\n\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 3 }],
    },
    // reference types comment in TypeScript file
    {
      code: '// Copyright © 2026\n\n/// <reference types="@solidjs/start/env" />',
      filename: 'file.d.ts',
      options: [{ template: 'Copyright © YYYY' }],
    },
    // Extensions allow-list can skip files
    {
      code: 'const foo = "bar";',
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY', newlines: 1, extensions: ['js'] }],
    },
  ],
  invalid: [
    // Missing copyright in JS file
    {
      code: 'const foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Missing copyright in TS file
    {
      code: 'const foo: string = "bar";',
      filename: 'file.ts',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\nconst foo: string = "bar";',
    },
    // Outdated copyright year in JS file
    {
      code: '// Copyright © 2023\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'outdatedCopyright' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Copyright not at the beginning of the file
    {
      code: '\n// Copyright © 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'incorrectPosition' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Multiple newlines after copyright setting
    {
      code: 'const foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\n\nconst foo = "bar";',
    },
    // Incorrect number of newlines after copyright (fewer than required)
    {
      code: '// Copyright © 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'incorrectNewlines' }],
      output: '// Copyright © 2026\n\nconst foo = "bar";',
    },
    // Incorrect number of newlines after copyright (more than required)
    {
      code: '// Copyright © 2026\n\n\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'incorrectNewlines' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Incorrect number of newlines with a comment
    {
      code: '// Copyright © 2026\n/// <reference types="@solidjs/start/env" />',
      filename: 'file.d.ts',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'incorrectNewlines' }],
      output: '// Copyright © 2026\n\n/// <reference types="@solidjs/start/env" />',
    },
    // Duplicate copyright notices (even when separated by newlines)
    {
      code: '// Copyright © 2026\n\n// Copyright © 2026\n\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'duplicateCopyright' }],
      output: '// Copyright © 2026\n\nconst foo = "bar";',
    },
    // Extensions allow-list can include new extensions
    {
      code: 'const foo = "bar";',
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY', newlines: 1, extensions: ['rs'] }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Extensions option is normalized (leading dot + case)
    {
      code: 'const foo = "bar";',
      filename: 'file.RS',
      options: [{ template: 'Copyright © YYYY', newlines: 1, extensions: ['.rs'] }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
  ],
});

// Test basic CSS copyright presence
cssTester.run('copyright (CSS) - basic presence', copyrightRule, {
  valid: [
    // Valid CSS file with correct copyright
    {
      code: '/* Copyright © 2026 */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
  ],
  invalid: [
    // Missing copyright in CSS file
    {
      code: 'body { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
  ],
});

// Test CSS copyright year validation
cssTester.run('copyright (CSS) - year validation', copyrightRule, {
  valid: [
    // Valid CSS file with current year
    {
      code: '/* Copyright © 2026 */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
  ],
  invalid: [
    // Outdated copyright year in CSS file
    {
      code: '/* Copyright © 2023 */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'outdatedCopyright' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
  ],
});

// Test CSS newline requirements
cssTester.run('copyright (CSS) - newline requirements', copyrightRule, {
  valid: [
    // Valid CSS file with correct number of newlines
    {
      code: '/* Copyright © 2026 */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
    // Valid CSS file with multiple newlines
    {
      code: '/* Copyright © 2026 */\n\n\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 3 }],
    },
  ],
  invalid: [
    // Too many newlines after copyright in CSS file
    {
      code: '/* Copyright © 2026 */\n\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'incorrectNewlines' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
    // Too few newlines after copyright in CSS file
    {
      code: '/* Copyright © 2026 */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'incorrectNewlines' }],
      output: '/* Copyright © 2026 */\n\nbody { color: red; }',
    },
  ],
});

// Test duplicate detection in CSS copyright notices
cssTester.run('copyright (CSS) - duplicate detection', copyrightRule, {
  valid: [],
  invalid: [
    {
      code: '/* Copyright © 2026 */\n\n/* Copyright © 2026 */\n\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'duplicateCopyright' }],
      output: '/* Copyright © 2026 */\n\nbody { color: red; }',
    },
  ],
});

// Test whitespace edge cases in copyright notices
ruleTester.run('copyright (JS/TS) - whitespace edge cases', copyrightRule, {
  valid: [
    // No whitespace edge cases should be valid
  ],
  invalid: [
    // Extra spaces before copyright
    {
      code: '//    Copyright © 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Extra spaces after copyright
    {
      code: '// Copyright © 2026    \nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // No space after comment token
    {
      code: '//Copyright © 2026\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Fix extra spaces with outdated year
    {
      code: '//    Copyright © 2023\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
  ],
});

// // Test CSS whitespace edge cases
cssTester.run('copyright (CSS) - whitespace edge cases', copyrightRule, {
  valid: [
    // No whitespace edge cases should be valid
  ],
  invalid: [
    // Extra spaces in CSS comment
    {
      code: '/*    Copyright © 2026    */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
    // No spaces in CSS comment
    {
      code: '/*Copyright © 2026*/\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
    // Fix extra spaces in CSS comment with outdated year
    {
      code: '/*    Copyright © 2023    */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
    // Fix no spaces in CSS comment with outdated year
    {
      code: '/*Copyright © 2023*/\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
  ],
});

// Test non-matching copyright formats
ruleTester.run('copyright (JS/TS) - non-matching copyright', copyrightRule, {
  valid: [
    {
      code: '// Copyright © 2026 Raven Punk LLC\n// Copyright © 2026 ACME, Inc.',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
    },
  ],
  invalid: [
    // Copyright notice placed after non-matching copyright's
    {
      code: '// Copyright © 2026 ACME, Inc.\n// Copyright © 2026 Raven Punk LLC\n',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'incorrectPosition' }],
      output: '// Copyright © 2026 Raven Punk LLC\n// Copyright © 2026 ACME, Inc.\n',
    },
    {
      code: '// Copyright © 2023 ACME, Inc.\n',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 2 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026 Raven Punk LLC\n\n// Copyright © 2023 ACME, Inc.\n',
    },
  ],
});

// Test for case sensitivity in copyright notices
ruleTester.run('copyright (JS/TS) - case sensitivity', copyrightRule, {
  valid: [
    // Exactly matching case is valid
    {
      code: '// Copyright © 2026 Raven Punk LLC\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
    },
  ],
  invalid: [
    // Incorrect case in "Copyright" word
    {
      code: '// copyright © 2026 Raven Punk LLC\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026 Raven Punk LLC\nconst foo = "bar";',
    },
    // Incorrect case in company name
    {
      code: '// Copyright © 2026 RAVEN PUNK LLC\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026 Raven Punk LLC\nconst foo = "bar";',
    },
    // Mixed case issues and outdated year
    {
      code: '// copyright © 2023 raven punk llc\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026 Raven Punk LLC\nconst foo = "bar";',
    },
  ],
});

// Test for case sensitivity in CSS copyright notices
cssTester.run('copyright (CSS) - case sensitivity', copyrightRule, {
  valid: [
    // Exactly matching case is valid
    {
      code: '/* Copyright © 2026 Raven Punk LLC */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
    },
  ],
  invalid: [
    // Incorrect case in "Copyright" word in CSS
    {
      code: '/* copyright © 2026 Raven Punk LLC */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 Raven Punk LLC */\nbody { color: red; }',
    },
    // Incorrect case in company name in CSS
    {
      code: '/* Copyright © 2026 raven punk llc */\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 Raven Punk LLC */\nbody { color: red; }',
    },
  ],
});

// Test for incorrect comment style
ruleTester.run('copyright (JS/TS) - incorrect comment style', copyrightRule, {
  valid: [],
  invalid: [
    // Using multi-line comment style in JS/TS file
    {
      code: '/* Copyright © 2026 */\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
    // Using multi-line comment style with outdated year
    {
      code: '/* Copyright © 2023 */\nconst foo = "bar";',
      filename: 'file.js',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '// Copyright © 2026\nconst foo = "bar";',
    },
  ],
});

// Test for incorrect comment style in CSS files
cssTester.run('copyright (CSS) - incorrect comment style', copyrightRule, {
  valid: [],
  invalid: [
    // Using incorrect closing multi-line comment format
    {
      code: '/* Copyright © 2026*/\nbody { color: red; }',
      filename: 'file.css',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'invalidCopyrightFormat' }],
      output: '/* Copyright © 2026 */\nbody { color: red; }',
    },
  ],
});
