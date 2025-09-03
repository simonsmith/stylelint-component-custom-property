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

  const afterComponent = property.slice(`--${componentName}`.length)

  const pattern =
    config.pattern ||
    /^(?:-[a-z][a-zA-Z]*)*(?:--[a-z][a-zA-Z]*)*(?:-on[A-Z][a-zA-Z]*)*-[a-z][a-zA-Z]*$/

  return pattern.test(afterComponent)
}

export function isValidSuitCssProperty(
  property: string,
  componentName: string,
) {
  return isValidCustomProperty(property, componentName)
}
