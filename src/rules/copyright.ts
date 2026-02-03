import type { Rule } from 'eslint';
import * as path from 'node:path';

export interface CopyrightOptions {
  template: string;
  newlines?: number;
  extensions?: string[];
}

export type MessageIds =
  | 'missingCopyright'
  | 'outdatedCopyright'
  | 'incorrectPosition'
  | 'incorrectNewlines'
  | 'duplicateCopyright'
  | 'invalidCopyrightFormat';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeExtensions(extensions: string[]): string[] {
  return extensions
    .map(extension => extension.trim().toLowerCase().replace(/^\./u, ''))
    .filter(Boolean);
}

// Create the rule using ESLint v9 compatible format
export const copyrightRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure files have a copyright notice as the very first line.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'The copyright text template (use YYYY for year placeholder)',
          },
          newlines: {
            type: 'number',
            description: 'Number of newlines to append after the copyright comment',
            minimum: 1,
            default: 2,
          },
          extensions: {
            type: 'array',
            description:
              'Optional allow-list of file extensions to check (without leading dot). Prefer ESLint `files` globs.',
            items: { type: 'string' },
          },
        },
        required: ['template'],
        additionalProperties: false,
      },
    ],
    messages: {
      missingCopyright: 'Missing copyright comment',
      outdatedCopyright: 'Outdated copyright year in comment',
      incorrectPosition: 'Copyright comment must be at the very first line of the file',
      incorrectNewlines: 'Incorrect number of newlines after copyright comment',
      duplicateCopyright: 'Duplicate copyright comment',
      invalidCopyrightFormat: 'Copyright comment has incorrect formatting or whitespace',
    },
  },
  create(context) {
    // Safely parse options with proper type handling
    const rawOptions = context.options[0] as CopyrightOptions | undefined;
    const options: CopyrightOptions = {
      template: rawOptions?.template ?? 'Copyright © YYYY',
      newlines: rawOptions?.newlines ?? 2,
      extensions: rawOptions?.extensions,
    };

    const template = options.template;
    // Ensure newlines is always a number by providing a default and clamping to >= 1
    const newlines = Math.max(1, options.newlines ?? 2);

    const currentYear = new Date().getFullYear().toString();
    const copyrightTextWithYear: string = template.replace(/YYYY/gu, currentYear);

    // Check if the file extension is supported
    const filePath = context.filename;
    const fileExtension = path.extname(filePath).slice(1).toLowerCase();
    const extensionAllowList = options.extensions?.length
      ? new Set(normalizeExtensions(options.extensions))
      : undefined;

    // If an allow-list is configured, skip files that don't match it.
    if (extensionAllowList && (!fileExtension || !extensionAllowList.has(fileExtension))) {
      return {};
    }

    // File type agnostic function to check copyright notice
    function checkCopyright() {
      // Determine comment style based on file extension
      const expectedCopyright =
        fileExtension === 'css' ? `/* ${copyrightTextWithYear} */` : `// ${copyrightTextWithYear}`;

      const sourceCode = context.sourceCode;
      const sourceText = sourceCode.getText();

      // Get raw text lines
      const lines = sourceCode.lines;
      const lineStartIndices: number[] = [0];
      for (
        let idx = sourceText.indexOf('\n');
        idx !== -1;
        idx = sourceText.indexOf('\n', idx + 1)
      ) {
        lineStartIndices.push(idx + 1);
      }

      // Create regex for detecting copyright text with any year
      // Escape special regex characters in the copyright text except YYYY
      const escapedCopyrightText: string = escapeRegExp(template).replace(/YYYY/gu, '\\d{4}');

      // Create regexes for different comment styles to find copyright (tolerant for detection)
      const singleLineRegex = `\\/\\/\\s*${escapedCopyrightText}`;
      const multiLineRegex = `\\/\\*\\s*${escapedCopyrightText}\\s*\\*\\/`;

      const singleLineCommentRegex = new RegExp(`^\\s*${singleLineRegex}\\s*$`);
      const multiLineCommentRegex = new RegExp(`^\\s*${multiLineRegex}\\s*$`);

      // Create case-insensitive regexes for detecting copyright text with incorrect case
      const singleLineRegexCaseInsensitive = singleLineRegex; // Same as above, just used with 'i' flag
      const multiLineRegexCaseInsensitive = multiLineRegex; // Same as above, just used with 'i' flag

      const singleLineCommentRegexCaseInsensitive = new RegExp(
        `^\\s*${singleLineRegexCaseInsensitive}\\s*$`,
        'i'
      );
      const multiLineCommentRegexCaseInsensitive = new RegExp(
        `^\\s*${multiLineRegexCaseInsensitive}\\s*$`,
        'i'
      );

      // Strict format check: correct comment token, one space padding, no leading/trailing whitespace
      const strictSingleLineCommentRegex = new RegExp(`^\\/\\/ ${escapedCopyrightText}$`);
      const strictMultiLineCommentRegex = new RegExp(`^\\/\\* ${escapedCopyrightText} \\*\\/$`);

      const isBlankLine = (line: string) => line.trim() === '';

      // No content in the file
      if (!sourceText.trim()) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'missingCopyright',
          fix(fixer) {
            const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';
            return fixer.replaceTextRange(
              [0, sourceText.length],
              `${expectedCopyright}${eol.repeat(newlines)}`
            );
          },
        });
        return;
      }

      const eol = sourceText.includes('\r\n') ? '\r\n' : '\n';

      const headerText = `${expectedCopyright}${eol.repeat(newlines)}`;
      const isMatchingCopyrightCaseInsensitive = (line: string) =>
        singleLineCommentRegexCaseInsensitive.test(line) ||
        multiLineCommentRegexCaseInsensitive.test(line);

      let leadingContentLine = 0;
      while (
        leadingContentLine < lines.length &&
        (isBlankLine(lines[leadingContentLine]) ||
          isMatchingCopyrightCaseInsensitive(lines[leadingContentLine]))
      ) {
        leadingContentLine++;
      }

      const leadingContentStartIndex = lineStartIndices[leadingContentLine] ?? sourceText.length;

      const fixHeader = (fixer: Rule.RuleFixer) =>
        fixer.replaceTextRange([0, leadingContentStartIndex], headerText);

      const matchingLineIndices: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (isMatchingCopyrightCaseInsensitive(lines[i])) {
          matchingLineIndices.push(i);
        }
      }

      // No matching copyright anywhere, report missing
      if (matchingLineIndices.length === 0) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'missingCopyright',
          fix(fixer) {
            return fixHeader(fixer);
          },
        });
        return;
      }

      // Must be at the very first line (line 1, column 0)
      const firstLine = lines[0] ?? '';
      const firstLineIsCopyrightCaseInsensitive =
        singleLineCommentRegexCaseInsensitive.test(firstLine) ||
        multiLineCommentRegexCaseInsensitive.test(firstLine);
      if (!firstLineIsCopyrightCaseInsensitive) {
        const firstMatch = matchingLineIndices[0];
        context.report({
          loc: { line: firstMatch + 1, column: 0 },
          messageId: 'incorrectPosition',
          fix(fixer) {
            const fixes: Rule.Fix[] = [fixHeader(fixer)];
            for (const matchLine of matchingLineIndices) {
              const start = lineStartIndices[matchLine] ?? 0;
              if (start < leadingContentStartIndex) continue;

              const end = lineStartIndices[matchLine + 1] ?? sourceText.length;

              fixes.push(fixer.removeRange([start, end]));
            }

            return fixes;
          },
        });
        return;
      }

      const firstLineIsCopyrightCaseSensitive =
        singleLineCommentRegex.test(firstLine) || multiLineCommentRegex.test(firstLine);
      if (!firstLineIsCopyrightCaseSensitive) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'invalidCopyrightFormat',
          fix(fixer) {
            return fixHeader(fixer);
          },
        });
        return;
      }

      // Duplicate detection (matching notice in the initial header block)
      let firstDuplicateIndex: number | undefined;
      let scanLine = 1;
      while (scanLine < lines.length) {
        if (isBlankLine(lines[scanLine])) {
          scanLine++;
          continue;
        }
        if (isMatchingCopyrightCaseInsensitive(lines[scanLine])) {
          firstDuplicateIndex = scanLine;
        }
        break;
      }

      if (firstDuplicateIndex !== undefined) {
        context.report({
          loc: { line: firstDuplicateIndex + 1, column: 0 },
          messageId: 'duplicateCopyright',
          fix(fixer) {
            return fixHeader(fixer);
          },
        });
        return;
      }

      // Check for strict formatting (correct comment style + whitespace)
      const hasFormatIssue =
        fileExtension === 'css'
          ? !strictMultiLineCommentRegex.test(firstLine)
          : !strictSingleLineCommentRegex.test(firstLine);

      // Check if year is current
      const needsYearUpdate = !firstLine.includes(copyrightTextWithYear);

      // Check if the correct number of blank lines follow the copyright
      let actualBlankLines = 0;
      let i = 1;
      while (i < lines.length && isBlankLine(lines[i])) {
        actualBlankLines++;
        i++;
      }

      const expectedBlankLines = Math.max(0, newlines - 1);
      const hasCorrectNewlines = actualBlankLines === expectedBlankLines;

      if (hasFormatIssue || needsYearUpdate || !hasCorrectNewlines) {
        context.report({
          loc: {
            start: { line: 1, column: 0 },
            end: { line: Math.max(2, 1 + actualBlankLines), column: 0 },
          },
          messageId: hasFormatIssue
            ? 'invalidCopyrightFormat'
            : needsYearUpdate
              ? 'outdatedCopyright'
              : 'incorrectNewlines',
          fix(fixer) {
            return fixHeader(fixer);
          },
        });
      }
    }

    return {
      // DO NOT MODIFY THIS RETURN STATEMENT!
      '*'(node: unknown) {
        if (node === context.sourceCode.ast) {
          checkCopyright();
        }
      },
    };
  },
};
