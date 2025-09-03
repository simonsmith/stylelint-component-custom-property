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
  filenameWarning: (filename: string, componentName: string) =>
    `"${filename}" converted to PascalCase component name "${componentName}". This file should be renamed`,
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

    const {componentName, filename, isAlreadyValid} = componentInfo
    const expectedPrefix = `--${componentName}`

    // if the file name matches the component after we've 'pascaled' it then we
    // can proceed but it's worth warning the user that they need to update the
    // CSS filename
    if (!isAlreadyValid) {
      report({
        result,
        ruleName,
        message: messages.filenameWarning(filename, componentName),
        node: root,
        severity: 'warning',
      })
    }

    const {validationType = 'default'} = config

    root.walkDecls((decl: Declaration) => {
      const {prop, value} = decl

      // here we're assuming this is the "Direct assignment" part of the flow
      // i.e the user is doing something like `:root { --Component-color: red; }`
      if (prop.startsWith('--')) {
        validateCustomProperty({
          property: prop,
          componentName,
          expectedPrefix,
          decl,
          result,
          validationType,
          isVar: false,
        })
      }

      // this one is for the "Fallback declarations" path and would be
      // something like `.root { color: var(--Component-color, red) }`
      //
      // we gather all the variables from the declaration as a user can create
      // multiple
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
          isVar: true,
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
  const pascalFilename = pascalCase(filename)

  return {
    filename,
    componentName: pascalFilename,
    isAlreadyValid: pascalFilename === filename,
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
  isVar?: boolean
}

function validateCustomProperty(config: ValidateCustomPropertyConfig) {
  const {
    property,
    componentName,
    expectedPrefix,
    decl,
    result,
    validationType,
    isVar = false,
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

  // if it's not valid at this point we can easily fix it
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
