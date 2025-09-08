import stylelint from 'stylelint'
import {pascalCase} from 'es-toolkit/string'
import path from 'path'
import {isValidCustomProperty, isValidSuitCssProperty} from './validate.js'
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
  invalidSuitCss: (property: string, reason: string) =>
    `Custom property "${property}" does not follow SUIT CSS naming convention: ${reason}`,
})

const meta: RuleMeta = {
  url: 'https://github.com/simonsmith/stylelint-component-custom-property',
  fixable: true,
}

// matches var() functions with fallbacks like: var(--Button-spacing, 1rem)
const VAR_FALLBACK = /var\((--[^,)]+),\s*[^)]+\)/g
// matches the prefix part of custom properties like: --Button from --Button-color
const CUSTOM_PROPERTY_PREFIX = /^--[^-]*/
// matches everything after the component prefix like: -color from --Button-color
const CUSTOM_PROPERTY_SUFFIX = /^--[^-]*-?/

type PluginConfigObject = {
  validationType?: 'default' | 'suitcss' | RegExp
}

type PluginConfig = PluginConfigObject | boolean

const ruleFunction: Rule = (primary: PluginConfig = true) => {
  return (root: Root, result: PostcssResult) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: (value: unknown) => {
        if (typeof value === 'boolean') {
          return true
        }
        if (typeof value !== 'object' || value === null) {
          return false
        }
        // we can be sure it's definitely an object now
        const config = value as PluginConfigObject
        const {validationType} = config

        return (
          validationType === 'default' ||
          validationType === 'suitcss' ||
          validationType instanceof RegExp
        )
      },
    })

    if (!validOptions) {
      return
    }

    const config =
      typeof primary === 'boolean' ? (primary ? {} : null) : primary

    if (!config) {
      return
    }

    const filePath = result.root.source?.input?.from
    if (!filePath) {
      return
    }

    const componentInfo = getComponentInfo(filePath)
    if (!componentInfo) {
      return
    }

    const {componentName} = componentInfo
    const expectedPrefix = `--${componentName}`
    const {validationType = 'default'} = config

    root.walkDecls((decl: Declaration) => {
      const {value} = decl

      // Only validate API declarations - var() functions with fallbacks
      // These represent the component's public interface that can be overridden
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
          validationType,
        })
      })
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

function getComponentInfo(filepath: string) {
  const basename = path.basename(filepath)

  if (!basename.endsWith('.module.css')) {
    return null
  }

  const filename = basename.replace('.module.css', '')
  const componentName = pascalCase(filename)

  return {
    filename,
    componentName,
  }
}

function extractFallbackVars(value: string) {
  const fallbackVarRegex = VAR_FALLBACK
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
  validationType: 'default' | 'suitcss' | RegExp
}

function validateCustomProperty(config: ValidateCustomPropertyConfig) {
  const {
    property,
    componentName,
    expectedPrefix,
    decl,
    result,
    validationType,
  } = config

  let isValid = false

  if (validationType === 'default') {
    isValid = isValidCustomProperty(property, componentName)
  }
  if (validationType === 'suitcss') {
    isValid = isValidSuitCssProperty(property, componentName)
  }
  if (validationType instanceof RegExp) {
    isValid = isValidCustomProperty(property, componentName, {
      pattern: validationType,
    })
  }

  if (isValid) {
    return
  }

  const actualPrefix = property.match(CUSTOM_PROPERTY_PREFIX)?.[0] || property

  // Fix by replacing the property name in the var() function
  report({
    result,
    ruleName,
    message: messages.invalid(property, expectedPrefix, actualPrefix),
    node: decl,
    fix() {
      const suffix = property.replace(CUSTOM_PROPERTY_SUFFIX, '')
      const correctedProp = `--${componentName}-${suffix}`
      decl.value = decl.value.replace(property, correctedProp)
    },
  })
}

export default createPlugin(ruleName, ruleFunction)
