import stylelint from 'stylelint'
import {pascalCase} from 'es-toolkit/string'
import path from 'path'
import {isValidCustomProperty} from './validate.js'
import type {Rule, PostcssResult, RuleMeta} from 'stylelint'
import type {Root, Declaration} from 'postcss'

const {
  createPlugin,
  utils: {report, ruleMessages, validateOptions},
} = stylelint

const ruleName = '@simonsmith/stylelint-component-custom-property'

const messages = ruleMessages(ruleName, {
  invalid: (property: string, expected: string, actual: string) =>
    `Custom property "${property}" should start with "${expected}" but starts with "${actual}"`,
  filenameWarning: (filename: string, componentName: string) =>
    `"${filename}" converted to PascalCase component name "${componentName}". This file should be renamed`,
})

const meta: RuleMeta = {
  url: 'https://github.com/simonsmith/stylelint-component-custom-property',
  fixable: true,
}

// matches var() functions with fallbacks like: var(--Button-spacing, 1rem)
const VAR_WITH_FALLBACK = /var\((--[^,)]+),\s*[^)]+\)/g
// matches the prefix part of custom properties like: --Button from --Button-color
const CUSTOM_PROPERTY_PREFIX = /^--[^-]*/
// matches everything after the component prefix like: -color from --Button-color
const CUSTOM_PROPERTY_SUFFIX = /^--[^-]*-?/

const ruleFunction: Rule = (primary: Rule<boolean>) => {
  return (root: Root, result: PostcssResult) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: [true, false],
    })

    if (!validOptions || !primary) {
      return
    }

    const filePath = result.root.source?.input?.from
    if (!filePath) {
      return
    }

    const componentInfo = getComponentName(filePath)
    if (!componentInfo) {
      return
    }

    const {componentName, filename, isAlreadyValid} = componentInfo
    const expectedPrefix = `--${componentName}`

    if (!isAlreadyValid) {
      report({
        result,
        ruleName,
        message: messages.filenameWarning(filename, componentName),
        node: root,
        severity: 'warning',
      })
    }

    root.walkDecls((decl: Declaration) => {
      const {prop, value} = decl

      if (prop.startsWith('--')) {
        validateCustomProperty({
          property: prop,
          componentName,
          expectedPrefix,
          decl,
          result,
          isVar: false,
        })
      }

      const fallbackVars = extractFallbackVars(value)
      fallbackVars.forEach((customProp) => {
        if (!customProp) {
          return
        }

        validateCustomProperty({
          property: customProp,
          componentName,
          expectedPrefix,
          decl,
          result,
          isVar: true,
        })
      })
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

function getComponentName(filepath: string) {
  const basename = path.basename(filepath)

  if (!basename.endsWith('.module.css')) {
    return null
  }

  const filename = basename.replace('.module.css', '')
  const pascalFilename = pascalCase(filename)

  return {
    filename,
    componentName: pascalFilename,
    isAlreadyValid: pascalFilename === filename,
  }
}

function extractFallbackVars(value: string) {
  const fallbackVarRegex = VAR_WITH_FALLBACK
  const matches = []
  let match

  while ((match = fallbackVarRegex.exec(value)) !== null) {
    matches.push(match[1])
  }

  return matches
}

type ValidateCustomPropertyConfig = {
  property: string
  componentName: string
  expectedPrefix: string
  decl: Declaration
  result: PostcssResult
  isVar?: boolean
}

function validateCustomProperty(config: ValidateCustomPropertyConfig) {
  const {
    property,
    componentName,
    expectedPrefix,
    decl,
    result,
    isVar = false,
  } = config

  if (isValidCustomProperty(property, componentName)) {
    return
  }

  const actualPrefix = property.match(CUSTOM_PROPERTY_PREFIX)?.[0] || property

  report({
    result,
    ruleName,
    message: messages.invalid(property, expectedPrefix, actualPrefix),
    node: decl,
    fix() {
      const suffix = property.replace(CUSTOM_PROPERTY_SUFFIX, '')
      const correctedProp = `--${componentName}-${suffix}`
      if (isVar) {
        decl.value = decl.value.replace(property, correctedProp)
      } else {
        decl.prop = correctedProp
      }
    },
  })
}

export default createPlugin(ruleName, ruleFunction)
