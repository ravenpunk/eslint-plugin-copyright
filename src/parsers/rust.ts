import type { AST, Linter } from 'eslint';

function getEndLoc(text: string): { line: number; column: number } {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(eol);
  return { line: lines.length, column: lines[lines.length - 1]?.length ?? 0 };
}

/**
 * A minimal parser that accepts any input and returns an empty Program AST.
 * This exists purely so ESLint can run "text-based" rules (like header checks)
 * against non-JS files such as Rust.
 */
export const rustParser: Linter.Parser = {
  meta: {
    name: 'eslint-plugin-copyright/rust-parser',
    version: '1.2.1',
  },
  parseForESLint(text: string) {
    const end = getEndLoc(text);

    // eslint expects a Program-like shape with location/range info.
    const ast = {
      type: 'Program',
      body: [],
      sourceType: 'module',
      range: [0, text.length],
      loc: {
        start: { line: 1, column: 0 },
        end,
      },
      comments: [],
      tokens: [],
    };

    return {
      ast: ast as unknown as AST.Program,
      visitorKeys: { Program: ['body'] },
      services: {},
    };
  },
};
