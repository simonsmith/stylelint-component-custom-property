export function isValidSuitCssProperty(
  property: string,
  componentName: string,
): boolean {
  if (!property.startsWith(`--${componentName}`)) {
    return false
  }

  const afterComponent = property.slice(`--${componentName}`.length)
  if (!afterComponent.startsWith('-')) {
    return false
  }

  // SUIT CSS pattern: [-descendant|--modifier][-onState]-(cssProperty|variableName)
  // This regex validates the structure but doesn't enforce semantic correctness
  const suitPattern =
    /^(?:-[a-z][a-zA-Z]*)*(?:--[a-z][a-zA-Z]*)*(?:-on[A-Z][a-zA-Z]*)*-[a-z][a-zA-Z]*$/

  return suitPattern.test(afterComponent)
}
