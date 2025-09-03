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
    description: 'valid custom properties',
    config: true,
    codeFilename: 'Button.module.css',
    accept: [
      {
        description: 'no custom properties',
        code: `.button { color: red; background: blue; }`,
      },
      {
        description: 'correct prefix',
        code: `.button { --Button-color: red; }`,
      },
      {
        description: 'multiple correct properties',
        code: `
          .button {
            --Button-primary: #007bff;
            --Button-secondary: #6c757d;
            --Button-padding: 0.5rem 1rem;
          }
        `,
      },
      {
        description: 'ignores custom properties used as values',
        code: `
        .root {
          color: var(--some-other-value);
        }
        `,
      },
      {
        description: 'accepts other selectors',
        code: `
          :root {
            --Button-primary: #007bff;
          }
          .button {
            --Button-secondary: red;
          }
        `,
      },
      {
        description: 'correct prefix in var() with fallback',
        code: `.button { gap: var(--Button-spacing, 1rem); }`,
      },
      {
        description: 'multiple var()',
        code: `.button { border: var(--Button-borderWidth, 1px) var(--Button-borderStyle, solid); }`,
      },
    ],
    reject: [
      {
        description: 'wrong prefix',
        code: `.button { --wrong-color: red; }`,
        warnings: [
          {
            message: messages.invalid('--wrong-color', '--Button', '--wrong'),
          },
        ],
      },
      {
        description: 'multiple var()',
        code: `.button { border: var(--wrong-borderWidth, 1px) var(--Button-borderStyle, solid); }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-borderWidth',
              '--Button',
              '--wrong',
            ),
          },
        ],
      },
      {
        description: 'no prefix',
        code: `.button { --color: red; }`,
        warnings: [
          {
            message: messages.invalid('--color', '--Button', '--color'),
          },
        ],
      },
      {
        description: 'wrong prefix in var() with fallback',
        code: `.button { gap: var(--wrong-spacing, 1rem); }`,
        warnings: [
          {
            message: messages.invalid('--wrong-spacing', '--Button', '--wrong'),
          },
        ],
      },
    ],
  })

  // TODO: the messaging on this test is a bit weird. It probably needs some
  // additional work to actually create something meaningful - but for now I've
  // left it as is
  testRule({
    description: 'suitcss option',
    config: {validationType: 'suitcss'},
    codeFilename: 'Component.module.css',
    reject: [
      {
        description: 'custom property that only passes in suitcss',
        code: `.button { --Component: red; }`,
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

  // TODO: this one also has bad error messaging for now - needs works
  testRule({
    description: 'custom regex option',
    config: {validationType: /^_[a-z][a-zA-Z]*$/},
    codeFilename: 'Component.module.css',
    accept: [
      {
        description: 'works with a custom regex',
        code: `.button { --Component_test: red; }`,
      },
    ],
    reject: [
      {
        description: 'works with a custom regex',
        code: `.button { --Component-test: red; }`,
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
        code: `.button { --Component-something: red; }`,
      },
    ],
  })

  testRule({
    description: 'different component names',
    config: true,
    codeFilename: 'UserProfile.module.css',
    accept: [
      {
        description: 'pascalcase component prefix',
        code: `.profile { --UserProfile-avatar-size: 50px; }`,
      },
    ],
    reject: [
      {
        description: 'wrong component prefix',
        code: `.profile { --Button-color: red; }`,
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
    description: 'filename warnings with property validation',
    config: true,
    codeFilename: 'user-profile.module.css',
    reject: [
      {
        description: 'filename warning only (properties are valid)',
        code: `.profile { --UserProfile-color: red; }`,
        warnings: [
          {
            message: messages.filenameWarning('user-profile', 'UserProfile'),
          },
        ],
      },
      {
        description: 'both filename and property issues',
        code: `.profile { --wrong-color: red; }`,
        warnings: [
          {
            message: messages.filenameWarning('user-profile', 'UserProfile'),
          },
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
        description: 'fix wrong prefix',
        code: `.button { --wrong-color: red; }`,
        fixed: `.button { --SomeComponent-color: red; }`,
        warnings: [
          {
            message: messages.invalid(
              '--wrong-color',
              '--SomeComponent',
              '--wrong',
            ),
          },
        ],
      },
      {
        description: 'fix wrong prefix in var() with fallback',
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
