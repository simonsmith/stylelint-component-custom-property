import {describe, expect, it} from 'vitest'
import {createTestUtils} from '@morev/stylelint-testing-library'

import plugin from './index.js'

// @ts-expect-error - this works at runtime but TS things it should be on the
// `default` property
const {ruleName, messages} = plugin.rule

const {createTestRule, createTestRuleConfig} = createTestUtils({
  testFunctions: {
    describe,
    expect,
    it,
  },
  plugins: [plugin],
})

describe('rule configuration', () => {
  const testRuleConfig = createTestRuleConfig({ruleName})

  testRuleConfig({
    description: 'primary option validation',
    accept: [
      {
        description: 'rule enabled',
        config: true,
      },
      {
        description: 'rule disabled',
        config: null,
      },
      {
        description: 'allows "default"',
        config: {validationType: 'default'},
      },
      {
        description: 'allows "suitcss"',
        config: {validationType: 'suitcss'},
      },
      {
        description: 'allows custom regex',
        config: {validationType: /some-regex/},
      },
    ],
    reject: [
      {
        description: 'invalid config type',
        config: 'invalid',
      },
      {
        description: 'number instead of boolean',
        config: 123,
      },
      {
        description: 'regex directly',
        config: /some-regex/,
      },

      {
        description: 'empty object',
        config: {},
      },
    ],
  })
})

describe('rule implementation', () => {
  const testRule = createTestRule({ruleName})

  testRule({
    description: 'valid API declarations',
    config: true,
    codeFilename: 'Button.module.css',
    accept: [
      {
        description: 'no custom properties',
        code: `.button { color: red; background: blue; }`,
      },
      {
        description: 'direct assignment (now ignored)',
        code: `.button { --Button-color: red; }`,
      },
      {
        description: 'direct assignment with wrong prefix (now ignored)',
        code: `.button { --wrong-color: red; }`,
      },
      {
        description: 'multiple direct assignments (now ignored)',
        code: `
          .button {
            --Button-primary: #007bff;
            --wrong-secondary: #6c757d;
            --another-padding: 0.5rem 1rem;
          }
        `,
      },
      {
        description: 'API declarations with correct prefix',
        code: `
          .container {
            margin-block: var(--Button-margin-block, 12px);
            margin-inline: var(--Button-margin-inline, auto);
            gap: var(--Button-spacing, 1rem);
          }
        `,
      },
      {
        description: 'complex API declarations',
        code: `
          .item.sidebar {
            max-inline-size: var(
              --Button-sidebar-max-inline,
              calc(var(--Button-sidebar-width) + var(--Button-gap) * 2)
            );
            min-inline-size: var(--Button-sidebar-min-width, var(--Button-sidebar-width));
          }
        `,
      },
      {
        description: 'var() without fallback (ignored)',
        code: `
        .root {
          color: var(--some-other-value);
          margin: var(--Button-spacing);
        }
        `,
      },
      {
        description: 'mixed direct assignments and API declarations',
        code: `
          .container {
            --any-internal-prop: value;
            --Button-internal: red;
            gap: var(--Button-spacing, 1rem);
            margin: var(--Button-margin, 0);
          }
        `,
      },
    ],
    reject: [
      {
        description: 'wrong prefix in API declaration',
        code: `.button { gap: var(--wrong-spacing, 1rem); }`,
        warnings: [
          {
            message: messages.invalid('--wrong-spacing', '--Button', '--wrong'),
          },
        ],
      },
      {
        description: 'multiple wrong prefixes in API declarations',
        code: `.button { border: var(--wrong-borderWidth, 1px) var(--another-borderStyle, solid); }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-borderWidth',
              '--Button',
              '--wrong',
            ),
          },
          {
            message: messages.invalid(
              '--another-borderStyle',
              '--Button',
              '--another',
            ),
          },
        ],
      },
      {
        description: 'no prefix in API declaration',
        code: `.button { gap: var(--spacing, 1rem); }`,
        warnings: [
          {
            message: messages.invalid('--spacing', '--Button', '--spacing'),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'suitcss option',
    config: {validationType: 'suitcss'},
    codeFilename: 'Component.module.css',
    reject: [
      {
        description: 'API declaration that only passes in suitcss',
        code: `.button { gap: var(--Component, 1rem); }`,
        warnings: [
          {
            message: messages.invalid(
              '--Component',
              '--Component',
              '--Component',
            ),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'custom regex option',
    config: {validationType: /^_[a-z][a-zA-Z]*$/},
    codeFilename: 'Component.module.css',
    accept: [
      {
        description: 'works with a custom regex',
        code: `.button { gap: var(--Component_test, 1rem); }`,
      },
    ],
    reject: [
      {
        description: 'works with a custom regex',
        code: `.button { gap: var(--Component-test, 1rem); }`,
        warnings: [
          {
            message: messages.invalid(
              '--Component-test',
              '--Component',
              '--Component',
            ),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'default option',
    config: {validationType: 'default'},
    codeFilename: 'Component.module.css',
    accept: [
      {
        description: 'works with the default option',
        code: `.button { gap: var(--Component-something, 1rem); }`,
      },
    ],
  })

  testRule({
    description: 'different component names',
    config: true,
    codeFilename: 'UserProfile.module.css',
    accept: [
      {
        description: 'pascalcase component prefix in API declaration',
        code: `.profile { gap: var(--UserProfile-avatar-size, 50px); }`,
      },
    ],
    reject: [
      {
        description: 'wrong component prefix in API declaration',
        code: `.profile { gap: var(--Button-color, red); }`,
        warnings: [
          {
            message: messages.invalid(
              '--Button-color',
              '--UserProfile',
              '--Button',
            ),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'files with acronyms and special casing',
    config: true,
    codeFilename: 'PDFViewer.module.css',
    accept: [
      {
        description: 'accepts API declarations with converted component name',
        code: `.viewer { gap: var(--PdfViewer-zoom-level, 1); }`,
      },
      {
        description: 'accepts direct assignments with any naming',
        code: `.viewer { --PDF-internal: value; --any-name: value; }`,
      },
    ],
    reject: [
      {
        description: 'still validates API declarations correctly',
        code: `.viewer { gap: var(--wrong-zoom, 1); }`,
        warnings: [
          {
            message: messages.invalid('--wrong-zoom', '--PdfViewer', '--wrong'),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'kebab-case filenames',
    config: true,
    codeFilename: 'user-profile.module.css',
    accept: [
      {
        description: 'converts kebab-case to PascalCase for validation',
        code: `.profile { gap: var(--UserProfile-avatar-size, 50px); }`,
      },
      {
        description: 'allows any direct assignments',
        code: `.profile { --user-profile-state: active; --any-name: value; }`,
      },
    ],
    reject: [
      {
        description: 'validates API declarations with converted name',
        code: `.profile { gap: var(--wrong-color, red); }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-color',
              '--UserProfile',
              '--wrong',
            ),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'autofix',
    config: true,
    codeFilename: 'SomeComponent.module.css',
    reject: [
      {
        description: 'fix wrong prefix in API declaration',
        code: `.container { gap: var(--wrong-spacing, 1rem); }`,
        fixed: `.container { gap: var(--SomeComponent-spacing, 1rem); }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-spacing',
              '--SomeComponent',
              '--wrong',
            ),
          },
        ],
      },
      {
        description: 'fix multiple wrong prefixes in API declaration',
        code: `.container { border: var(--wrong-width, 1px) var(--bad-style, solid); }`,
        fixed: `.container { border: var(--SomeComponent-width, 1px) var(--SomeComponent-style, solid); }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-width',
              '--SomeComponent',
              '--wrong',
            ),
          },
          {
            message: messages.invalid(
              '--bad-style',
              '--SomeComponent',
              '--bad',
            ),
          },
        ],
      },
    ],
  })

  testRule({
    description: 'non-module css files',
    config: true,
    codeFilename: 'global.css',
    accept: [
      {
        description: 'should ignore non-module files',
        code: `.global { --any-prefix: value; color: red; }`,
      },
    ],
  })
})
