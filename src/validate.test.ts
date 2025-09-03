import {test, expect, describe} from 'vitest'
import {isValidSuitCssProperty, isValidCustomProperty} from './validate.js'

describe('isValidCustomProperty (default)', () => {
  test('accepts valid component names with any suffix', () => {
    expect(isValidCustomProperty('--Button-color', 'Button')).toBe(true)
    expect(isValidCustomProperty('--Button-Color', 'Button')).toBe(true)
    expect(isValidCustomProperty('--Button-123', 'Button')).toBe(true)
    expect(isValidCustomProperty('--Button', 'Button')).toBe(true)
    expect(
      isValidCustomProperty('--UserProfile-avatar-size', 'UserProfile'),
    ).toBe(true)
  })

  test('rejects wrong component names', () => {
    expect(isValidCustomProperty('--Wrong-color', 'Button')).toBe(false)
    expect(isValidCustomProperty('--button-color', 'Button')).toBe(false)
  })
})

describe('isValidSuitCssProperty (strict SUIT CSS)', () => {
  test('accepts basic valid patterns', () => {
    expect(isValidSuitCssProperty('--Button-color', 'Button')).toBe(true)
    expect(isValidSuitCssProperty('--Button-icon-size', 'Button')).toBe(true)
    expect(isValidSuitCssProperty('--Button--primary-color', 'Button')).toBe(
      true,
    )
    expect(isValidSuitCssProperty('--Button-onHover-color', 'Button')).toBe(
      true,
    )
  })

  test('rejects what default function accepts', () => {
    expect(isValidSuitCssProperty('--Button', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button-Color', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button-Icon-size', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button-123', 'Button')).toBe(false)
    expect(isValidSuitCssProperty('--Button---primary-color', 'Button')).toBe(
      false,
    )
    expect(isValidSuitCssProperty('--Button--', 'Button')).toBe(false)
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

  test('rejects custom pattern when it does not match', () => {
    const underscorePattern = /^_[a-z][a-zA-Z]*$/
    expect(
      isValidCustomProperty('--Button-color', 'Button', {
        pattern: underscorePattern,
      }),
    ).toBe(false)
  })
})
