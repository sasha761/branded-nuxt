import { useVuelidate } from '@vuelidate/core'
import { normalizePhone, orderRules } from '~/utils/validation'

export interface OrderRef {
  id: string
  key: string
}

/** create_order отдаёт URL `…/order-received/{id}/?key=wc_order_…`; ключ нужен странице заказа. */
export function parseOrderUrl(value: unknown): OrderRef | null {
  if (typeof value !== 'string') {
    return null
  }

  try {
    const url = new URL(value, 'http://localhost')
    const id = url.pathname.match(/order-received\/(\d+)/)?.[1]
    const key = url.searchParams.get('key')
    return id && key ? { id, key } : null
  } catch {
    return null
  }
}

/**
 * Форма заказа: поля, валидация, отправка и ошибки WP
 * (422 — по полям и товарам, 429 — слишком много заказов).
 */
export function useOrderForm(getProducts: () => unknown[]) {
  const { t, te, locale } = useI18n()
  const { requestInProgress, waitRequest } = useWaitRequest()

  const formData = reactive({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    comments: '',
    // поле-ловушка для ботов, в вёрстке скрыто
    website: '',
  })

  const v$ = useVuelidate({ formData: orderRules }, { formData })
  const serverErrors = ref<Record<string, string>>({})
  const formError = ref('')

  watch(() => formData.phone, (value) => {
    const normalized = normalizePhone(value)
    if (normalized !== value) {
      formData.phone = normalized
    }
  })

  function errorText(code: string) {
    const key = `order_errors.${code}`
    return te(key) ? t(key) : t('order_errors.invalid')
  }

  /** Текст ошибки поля: сначала ответ WP, затем валидация формы. */
  function fieldError(name: keyof typeof orderRules) {
    const serverCode = serverErrors.value[name]
    if (serverCode) {
      return errorText(serverCode)
    }

    const field = (v$.value.formData as any)[name]
    const failed = field?.$errors?.[0]
    if (!field?.$error || !failed) {
      return ''
    }

    return t(`form.${failed.$validator}`, { min: failed.$params?.min, max: failed.$params?.max })
  }

  function handleError(error: any) {
    const status = Number(error?.statusCode ?? error?.response?.status)
    const errors: Record<string, string> | null = error?.data?.data?.errors ?? null

    if (status === 422 && errors) {
      const fields: Record<string, string> = {}
      let productError = ''

      for (const [key, code] of Object.entries(errors)) {
        if (key === 'products' || key.startsWith('products.')) {
          productError ||= code
        } else {
          fields[key] = code
        }
      }

      serverErrors.value = fields

      if (productError) {
        formError.value = errorText(productError)
      } else if (fields.coupon) {
        // поля купона в форме нет: купон истёк между котировкой и заказом
        formError.value = t('coupon.invalid')
      } else {
        formError.value = t('order_errors.check_fields')
      }
      return
    }

    formError.value = status === 429 ? t('order_errors.rate_limited') : t('order_errors.failed')
  }

  async function submit(extra: Record<string, unknown> = {}): Promise<OrderRef | null> {
    serverErrors.value = {}
    formError.value = ''

    const isValid = await v$.value.$validate()
    if (!isValid) {
      return null
    }

    const result = await waitRequest(async () => {
      try {
        const response = await $fetch('/api/cart/create_order', {
          method: 'POST',
          body: {
            ...formData,
            ...extra,
            products: getProducts(),
            lang: locale.value,
          },
        })

        const order = parseOrderUrl(response)
        if (!order) {
          formError.value = t('order_errors.failed')
        }
        return order
      } catch (error) {
        handleError(error)
        return null
      }
    })

    return result ?? null
  }

  return { formData, v$, serverErrors, formError, fieldError, submit, requestInProgress }
}
