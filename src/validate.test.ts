import {test, expect, describe} from 'vitest'
import {isValidSuitCssProperty, isValidCustomProperty} from './validate.js'

describe('valid patterns', () => {
  test('basic properties', () => {
    expect(isValidSuitCssProperty('--Button-color', 'Button')).toBe(true)
    expect(isValidSuitCssProperty('--Button-backgroundColor', 'Button')).toBe(
      true,
    )
  })

  test('descendants', () => {
    expect(isValidSuitCssProperty('--Button-icon-size', 'Button')).toBe(true)
  })

  test('modifiers', () => {
    expect(isValidSuitCssProperty('--Button--primary-color', 'Button')).toBe(
      true,
    )
  })

  test('states', () => {
    expect(isValidSuitCssProperty('--Button-onHover-color', 'Button')).toBe(
      true,
    )
  })

  test('complex combinations', () => {
    expect(
      isValidSuitCssProperty('--Button-icon-onHover-color', 'Button'),
    ).toBe(true)
    expect(
      isValidSuitCssProperty(
        '--Button--primary-onHover-backgroundColor',
        'Button',
      ),
    ).toBe(true)
  })
})

describe('invalid patterns', () => {
  test('wrong component name', () => {
    expect(isValidSuitCssProperty('--Wrong-color', 'Button')).toBe(false)
  })

  test('malformed properties', () => {
    expect(isValidSuitCssProperty('--Button', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button-', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--ButtonColor', 'Button')).toBe(false)
  })

  test('case violations', () => {
    expect(isValidSuitCssProperty('--Button-Color', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button-Icon-size', 'Button')).toBe(false)
  })

  test('invalid syntax', () => {
    expect(isValidSuitCssProperty('--Button---primary-color', 'Button')).toBe(
      false,
    )
  })
})

describe('different component names', () => {
  test('validates component name matching', () => {
    expect(
      isValidSuitCssProperty('--UserProfile-avatar-size', 'UserProfile'),
    ).toBe(true)
    expect(isValidSuitCssProperty('--Button-color', 'UserProfile')).toBe(false)
  })
})

describe('custom configuration', () => {
  test('accepts custom regex pattern', () => {
    const underscorePattern = /^_[a-z][a-zA-Z]*$/

    expect(
      isValidCustomProperty('--Button_color', 'Button', {
        pattern: underscorePattern,
      }),
    ).toBe(true)
  })
})
