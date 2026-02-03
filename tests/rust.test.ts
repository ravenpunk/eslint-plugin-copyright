import { afterAll, describe, expect, it, vi } from 'vitest';
import { RuleTester } from 'eslint';
import { rustParser } from '../src/index.js';
import { copyrightRule } from '../src/rules/copyright.js';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

describe('rustParser', () => {
  it('accepts arbitrary Rust code without throwing', () => {
    const parseForESLint = (rustParser as unknown as { parseForESLint?: (text: string) => unknown })
      .parseForESLint;
    expect(typeof parseForESLint).toBe('function');
    if (typeof parseForESLint !== 'function') return;

    expect(() => parseForESLint('fn main() { println!("hi"); }')).not.toThrow();
  });

  it('returns a Program AST with range/loc', () => {
    const text = 'fn main() {}\n';
    const parseForESLint = (rustParser as unknown as { parseForESLint?: (text: string) => unknown })
      .parseForESLint;
    expect(typeof parseForESLint).toBe('function');
    if (typeof parseForESLint !== 'function') return;

    const result = parseForESLint(text);
    expect(isRecord(result)).toBe(true);
    if (!isRecord(result)) return;

    const ast = result.ast;
    expect(isRecord(ast)).toBe(true);
    if (!isRecord(ast)) return;

    expect(ast.type).toBe('Program');
    expect(ast.range).toEqual([0, text.length]);

    const loc = ast.loc;
    expect(isRecord(loc)).toBe(true);
    if (!isRecord(loc)) return;

    const start = loc.start;
    expect(isRecord(start)).toBe(true);
    if (!isRecord(start)) return;

    expect(start).toEqual({ line: 1, column: 0 });
  });
});

const rustTester = new VitestRuleTester({
  languageOptions: { parser: rustParser },
});

rustTester.run('copyright (Rust)', copyrightRule, {
  valid: [
    {
      code: '// Copyright © 2026\nfn main() {}\n',
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
    },
  ],
  invalid: [
    {
      code: 'fn main() {}\n',
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY', newlines: 1 }],
      errors: [{ messageId: 'missingCopyright' }],
      output: '// Copyright © 2026\nfn main() {}\n',
    },
    {
      code: '// Copyright © 2026\n\n// Copyright © 2026\n\nfn main() {}\n',
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY', newlines: 2 }],
      errors: [{ messageId: 'duplicateCopyright' }],
      output: '// Copyright © 2026\n\nfn main() {}\n',
    },
    {
      code: `// Copyright © 2026 Raven Punk LLC. All rights reserved.\n\n// copyright (c) 2026 Raven Punk LLC. all rights reserved.\n\nuse serde::de::DeserializeOwned;\nuse serde_json::error::Category;\n`,
      filename: 'file.rs',
      options: [{ template: 'Copyright © YYYY Raven Punk LLC. All rights reserved.', newlines: 2 }],
      errors: [{ messageId: 'duplicateCopyright' }],
      output: `// Copyright © 2026 Raven Punk LLC. All rights reserved.\n\nuse serde::de::DeserializeOwned;\nuse serde_json::error::Category;\n`,
    },
  ],
});
