import { describe, expect, it } from 'vitest'
import { normalizePhone, PHONE_PATTERN } from '../../app/utils/validation'

describe('normalizePhone', () => {
  it.each([
    ['+38 (050) 123-45-67', '+380501234567'],
    ['050 123 45 67', '0501234567'],
    [' +380501234567 ', '+380501234567'],
    ['38-050-123-45-67', '380501234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it('обрезает до 15 цифр', () => {
    expect(normalizePhone('+1234567890123456789')).toBe('+123456789012345')
  })

  it('вставленный номер в любом формате проходит проверку WP (10–15 цифр)', () => {
    // Раньше maxlength обрезал «+38 (050) 123-45-67» до нормализации, и в заказ уходило 10 цифр
    expect(PHONE_PATTERN.test(normalizePhone('+38 (050) 123-45-67'))).toBe(true)
    expect(PHONE_PATTERN.test(normalizePhone('050 123'))).toBe(false)
  })
})
