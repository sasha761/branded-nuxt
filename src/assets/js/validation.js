// src/validation.js
import { required, email, minLength, maxLength, helpers } from '@vuelidate/validators'

export const validationRules = {
  firstName: { required, minLength: minLength(2) },
  lastName: { required, minLength: minLength(2) },
  email: { required, email },
  phone: { 
    required,
    numeric: helpers.regex('numeric', /^[0-9]+$/),
    minLength: minLength(10),
    maxLength: maxLength(15)
  },
  city: { required, minLength: minLength(3) },
  post: { required, minLength: minLength(2) }
}
