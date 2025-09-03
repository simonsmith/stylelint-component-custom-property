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
  const afterComponent = property.slice(`--${componentName}`.length)

  // ensures the component has a hyphen at the end and that we also have
  // some text there, just `--Component: red` is not allowed
  if (!pattern) {
    return afterComponent.startsWith('-') && afterComponent.length > 1
  }

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
