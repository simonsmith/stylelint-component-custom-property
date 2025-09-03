import stylelint from 'stylelint'
import {pascalCase} from 'es-toolkit/string'
import path from 'path'
import type {Rule, PostcssResult, RuleMeta} from 'stylelint'
import type {Root, Declaration} from 'postcss'

const {
  createPlugin,
  utils: {report, ruleMessages, validateOptions},
} = stylelint

const ruleName = '@simonsmith/stylelint-custom-property-prefix'

const messages = ruleMessages(ruleName, {
  invalid: (property: string, expected: string, actual: string) =>
    `Custom property "${property}" should start with "${expected}" but starts with "${actual}"`,
  filenameWarning: (filename: string, componentName: string) =>
    `"${filename}" converted to PascalCase component name "${componentName}". This file should be renamed`,
})

const meta: RuleMeta = {
  url: 'https://github.com/simonsmith/stylelint-custom-property-prefix',
  fixable: true,
}

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

function isValidCustomProperty(property: string, expectedPrefix: string) {
  return property.startsWith(`--${expectedPrefix}-`)
}

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

    root.walkDecls(/^--/, (decl: Declaration) => {
      const {prop} = decl

      if (isValidCustomProperty(prop, componentName)) {
        return
      }

      const actualPrefix = prop.match(/^--[^-]*/)?.[0] || prop
      report({
        result,
        ruleName,
        message: messages.invalid(prop, expectedPrefix, actualPrefix),
        node: decl,
        fix() {
          const suffix = prop.replace(/^--[^-]*-?/, '')
          const correctedProp = `--${componentName}-${suffix}`
          decl.prop = correctedProp
        },
      })
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages
ruleFunction.meta = meta

export default createPlugin(ruleName, ruleFunction)
