import { required, email, minLength, maxLength, helpers } from '@vuelidate/validators'

// WP принимает 10–15 цифр (inc/rest-api-cart.php), «+» допускается.
export const PHONE_PATTERN = /^\+?\d{10,15}$/

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 15)
  return value.trim().startsWith('+') ? `+${digits}` : digits
}

// Одни правила для checkout и «Купить в 1 клик»
export const orderRules = {
  firstName: { required, minLength: minLength(2), maxLength: maxLength(50) },
  lastName: { required, minLength: minLength(2), maxLength: maxLength(50) },
  email: { required, email },
  phone: { required, phoneFormat: helpers.regex(PHONE_PATTERN) },
  city: { required, minLength: minLength(2), maxLength: maxLength(100) },
  address: { required, maxLength: maxLength(200) },
}
