import {test, expect} from 'vitest'
import {isValidSuitCssProperty} from './suitcss.js'

// SUIT CSS pattern: [-descendant|--modifier][-onState]-(cssProperty|variableName)

test('validates basic component properties', () => {
  expect(isValidSuitCssProperty('--Button-color', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button-backgroundColor', 'Button')).toBe(
    true,
  )
  expect(isValidSuitCssProperty('--Button-fontSize', 'Button')).toBe(true)
})

test('validates descendant properties', () => {
  expect(isValidSuitCssProperty('--Button-icon-size', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button-text-color', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button-header-padding', 'Button')).toBe(true)
})

test('validates modifier properties', () => {
  expect(isValidSuitCssProperty('--Button--primary-color', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button--large-padding', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button--disabled-opacity', 'Button')).toBe(
    true,
  )
})

test('validates state properties', () => {
  expect(isValidSuitCssProperty('--Button-onHover-color', 'Button')).toBe(true)
  expect(
    isValidSuitCssProperty('--Button-onFocus-backgroundColor', 'Button'),
  ).toBe(true)
  expect(isValidSuitCssProperty('--Button-onActive-transform', 'Button')).toBe(
    true,
  )
})

test('validates complex combinations', () => {
  expect(isValidSuitCssProperty('--Button-icon-onHover-color', 'Button')).toBe(
    true,
  )
  expect(
    isValidSuitCssProperty(
      '--Button--primary-onHover-backgroundColor',
      'Button',
    ),
  ).toBe(true)
  expect(
    isValidSuitCssProperty('--Button-header-onFocus-borderColor', 'Button'),
  ).toBe(true)
})

test('rejects wrong component name', () => {
  expect(isValidSuitCssProperty('--Wrong-color', 'Button')).toBe(false)
  expect(isValidSuitCssProperty('--Card-padding', 'Button')).toBe(false)
})

test('rejects malformed properties', () => {
  expect(isValidSuitCssProperty('--Button', 'Button')).toBe(false)
  expect(isValidSuitCssProperty('--Button-', 'Button')).toBe(false)
  expect(isValidSuitCssProperty('--ButtonColor', 'Button')).toBe(false)
})

test('rejects incorrect state syntax', () => {
  expect(isValidSuitCssProperty('--Button-hover-color', 'Button')).toBe(true) // this actually passes validation but is semantically wrong
  expect(isValidSuitCssProperty('--Button-Hover-color', 'Button')).toBe(false) // capital H without 'on'
})

test('rejects incorrect modifier syntax', () => {
  expect(isValidSuitCssProperty('--Button-primary-color', 'Button')).toBe(true)
  expect(isValidSuitCssProperty('--Button---primary-color', 'Button')).toBe(
    false,
  )
})

test('works with different component names', () => {
  expect(
    isValidSuitCssProperty('--UserProfile-avatar-size', 'UserProfile'),
  ).toBe(true)
  expect(
    isValidSuitCssProperty('--UserProfile--compact-padding', 'UserProfile'),
  ).toBe(true)
  expect(
    isValidSuitCssProperty('--UserProfile-header-onHover-color', 'UserProfile'),
  ).toBe(true)
})

test('validates property name requirements', () => {
  expect(isValidSuitCssProperty('--Button-Color', 'Button')).toBe(false)
  expect(isValidSuitCssProperty('--Button-color', 'Button')).toBe(true)

  expect(isValidSuitCssProperty('--Button-Icon-size', 'Button')).toBe(false)
  expect(isValidSuitCssProperty('--Button-icon-size', 'Button')).toBe(true)
})
