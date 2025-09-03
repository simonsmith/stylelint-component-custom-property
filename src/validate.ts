type Config = {
  pattern?: RegExp
}

export function isValidCustomProperty(
  property: string,
  componentName: string,
  config: Config = {},
) {
  if (!property.startsWith(`--${componentName}`)) {
    return false
  }

  const {pattern} = config

  if (!pattern) {
    return true
  }

  const afterComponent = property.slice(`--${componentName}`.length)

  return pattern.test(afterComponent)
}

export function isValidSuitCssProperty(
  property: string,
  componentName: string,
) {
  /**
   * SUITCSS: --ComponentName[-descendant|--modifier][-onState]-(cssProperty|variableName)
   */
  const pattern =
    /^(?:-[a-z][a-zA-Z]*)*(?:--[a-z][a-zA-Z]*)*(?:-on[A-Z][a-zA-Z]*)*-[a-z][a-zA-Z]*$/

  return isValidCustomProperty(property, componentName, {pattern})
}
