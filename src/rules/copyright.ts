import type { Rule } from 'eslint';

export interface CopyrightOptions {
  template: string;
  newlines?: number;
}

export type MessageIds =
  | 'missingCopyright'
  | 'outdatedCopyright'
  | 'incorrectPosition'
  | 'incorrectNewlines'
  | 'invalidCopyrightFormat';

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
            minimum: 0,
            default: 2,
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
      invalidCopyrightFormat: 'Copyright comment has incorrect formatting or whitespace',
    },
  },
  create(context) {
    // Safely parse options with proper type handling
    const rawOptions = context.options[0] as CopyrightOptions | undefined;
    const options: CopyrightOptions = {
      template: rawOptions?.template ?? 'Copyright © YYYY',
      newlines: rawOptions?.newlines ?? 1,
    };

    const template = options.template;
    // Ensure newlines is always a number by providing a default
    const newlines = options.newlines ?? 1;

    const currentYear = new Date().getFullYear().toString();
    const copyrightTextWithYear: string = template.replace('YYYY', currentYear);

    // Check if the file extension is supported
    const filePath = context.filename;
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['js', 'jsx', 'ts', 'tsx', 'css'];

    // Skip processing if file extension is not supported
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      return {};
    }

    // File type agnostic function to check copyright notice
    function checkCopyright() {
      // Determine comment style based on file extension
      let commentPrefix = '// ';
      let commentSuffix = '';

      if (fileExtension === 'css') {
        commentPrefix = '/* ';
        commentSuffix = ' */';
      }

      const expectedCopyright = `${commentPrefix}${copyrightTextWithYear}${commentSuffix}`;

      const sourceCode = context.sourceCode;
      const sourceText = sourceCode.getText();

      // Get raw text lines
      const lines = sourceText.split('\n');

      // Skip leading empty lines
      let firstNonEmptyLine = 0;
      while (firstNonEmptyLine < lines.length && !lines[firstNonEmptyLine].trim()) {
        firstNonEmptyLine++;
      }

      // Create regex for detecting copyright text with any year
      // Escape special regex characters in the copyright text except YYYY
      const escapedCopyrightText: string = template
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace('YYYY', '\\d{4}');

      // Create regexes for different comment styles to find copyright
      const singleLineRegex = `\\/\\/\\s*${escapedCopyrightText.replace('\\\\d{4}', '\\d{4}')}`;
      const multiLineRegex = `\\/\\*\\s*${escapedCopyrightText.replace('\\\\d{4}', '\\d{4}')}\\s*\\*\\/`;

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

      // No content in the file
      if (!sourceText.trim()) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'missingCopyright',
          fix(fixer) {
            const newlinesStr = '\n'.repeat(newlines);
            return fixer.insertTextBeforeRange([0, 0], `${expectedCopyright}${newlinesStr}`);
          },
        });
        return;
      }

      // Check if the first non-empty line is a copyright comment
      if (firstNonEmptyLine === 0) {
        const firstLine = lines[0];
        const isCopyrightComment =
          singleLineCommentRegex.test(firstLine) || multiLineCommentRegex.test(firstLine);
        const isCopyrightCommentCaseInsensitive =
          singleLineCommentRegexCaseInsensitive.test(firstLine) ||
          multiLineCommentRegexCaseInsensitive.test(firstLine);

        // Case sensitivity check - if case-insensitive match but not case-sensitive match, it's a case format issue
        if (isCopyrightCommentCaseInsensitive && !isCopyrightComment) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'invalidCopyrightFormat',
            fix(fixer) {
              return fixer.replaceTextRange([0, firstLine.length], expectedCopyright);
            },
          });
          return;
        }

        if (isCopyrightComment) {
          // Check for correct formatting and whitespace
          let hasFormatIssue = false;

          if (fileExtension === 'css') {
            // For CSS: Check if format is exactly "/* Copyright text */"
            const cssCommentFormat = /^\/\*\s{1}.*\s{1}\*\/$/.test(firstLine);
            const noExtraSpaces = !/\/\*\s{2,}/.test(firstLine) && !/\s{2,}\*\/$/.test(firstLine);
            hasFormatIssue = !cssCommentFormat || !noExtraSpaces;
          } else {
            // For JS/TS: Check if format is exactly "// Copyright text" with no trailing spaces
            const jsCommentFormat = /^\/\/\s{1}[^/]/.test(firstLine);
            const noExtraLeadingSpaces = !/\/\/\s{2,}/.test(firstLine);
            const noTrailingSpaces = !/\s{2,}$/.test(firstLine);
            hasFormatIssue = !jsCommentFormat || !noExtraLeadingSpaces || !noTrailingSpaces;
          }

          // Check if year is current
          const needsYearUpdate = !firstLine.includes(copyrightTextWithYear);

          // Check if the correct number of newlines follow the copyright
          // In ESLint tests, the number of expected newlines in code strings
          // are represented by explicit \n characters in the string
          // So 1 newline means just going to the next line with no empty lines in between
          // If newlines is 2, we expect one empty line, then content
          // If newlines is n, we expect n-1 empty lines
          let actualNewlines = 0;
          let i = 1;
          while (i < lines.length && lines[i] === '') {
            actualNewlines++;
            i++;
          }

          const expectedEmptyLines = Math.max(0, newlines - 1);
          const hasCorrectNewlines = actualNewlines === expectedEmptyLines;

          // Handle formatting issues, year update, or newlines correction
          if (hasFormatIssue || needsYearUpdate || !hasCorrectNewlines) {
            context.report({
              loc: {
                start: { line: 1, column: 0 },
                end: { line: Math.max(2, 1 + actualNewlines), column: 0 },
              },
              messageId: hasFormatIssue
                ? 'invalidCopyrightFormat'
                : needsYearUpdate
                  ? 'outdatedCopyright'
                  : 'incorrectNewlines',
              fix(fixer) {
                // Find the actual content (non-empty line) after copyright
                let contentLineIndex = 1;
                while (contentLineIndex < lines.length && lines[contentLineIndex] === '') {
                  contentLineIndex++;
                }

                // Generate the expected newlines (already includes the first newline)
                const newlinesStr = '\n'.repeat(newlines);

                // Calculate the content start position
                let contentStart = lines[0].length + 1; // +1 for the first newline
                for (let j = 1; j < contentLineIndex; j++) {
                  contentStart += lines[j].length + 1; // +1 for each newline character
                }

                // Replace copyright line and following whitespace with new copyright + correct newlines
                return fixer.replaceTextRange(
                  [0, contentStart],
                  `${expectedCopyright}${newlinesStr}`
                );
              },
            });
            return;
          }

          // Otherwise it's valid, current, and has the right number of newlines
          return;
        }
      }

      // Check if copyright exists anywhere else in the file - also check for case-insensitive matches
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for case-insensitive copyright match anywhere in the file
        if (
          (singleLineCommentRegexCaseInsensitive.test(line) ||
            multiLineCommentRegexCaseInsensitive.test(line)) &&
          i !== 0
        ) {
          // Found copyright but not at the beginning
          // Calculate position in source text
          let lineStart = 0;
          for (let j = 0; j < i; j++) {
            lineStart += lines[j].length + 1; // +1 for the newline
          }

          context.report({
            loc: {
              start: { line: i + 1, column: 0 },
              end: { line: i + 1, column: line.length },
            },
            messageId: 'incorrectPosition',
            fix(fixer) {
              const fixes = [];

              // Add copyright at beginning
              const newlinesStr = '\n'.repeat(newlines);
              fixes.push(fixer.insertTextBeforeRange([0, 0], `${expectedCopyright}${newlinesStr}`));

              // Remove existing copyright and surrounding whitespace
              let lineEnd = lineStart + line.length;

              // Include preceding whitespace
              let removalStart = lineStart;
              while (removalStart > 0 && /\s/.test(sourceText[removalStart - 1])) {
                removalStart--;
              }

              // Include following newline if present but preserve trailing newline at EOF
              if (lineEnd < sourceText.length && sourceText[lineEnd] === '\n') {
                // Only consume the newline if it's not the last newline in the file
                if (lineEnd < sourceText.length - 1) {
                  lineEnd++;
                }
              }

              fixes.push(fixer.removeRange([removalStart, lineEnd]));

              return fixes;
            },
          });
          return;
        }
      }

      // No copyright found anywhere, report missing
      context.report({
        loc: { line: 1, column: 0 },
        messageId: 'missingCopyright',
        fix(fixer) {
          const newlinesStr = '\n'.repeat(newlines);
          return fixer.insertTextBeforeRange([0, 0], `${expectedCopyright}${newlinesStr}`);
        },
      });
    }

    return {
      // DO NOT MODIFY THIS RETURN STATEMENT!
      '*'(node) {
        if (node === context.sourceCode.ast) {
          checkCopyright();
        }
      },
    };
  },
};
