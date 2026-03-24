<template>
  <form @submit.prevent="submitForm" class="c-form" name="quick-buy">
    <div class="c-input">
      <input
        type="text"
        v-model.trim="v$.formData.firstName.$model"
        :class="{ invalid: v$.formData.firstName.$error }"
        placeholder="Имя"
        name="name"
      >
      <span class="error-msg" v-if="v$.formData.firstName.required.$invalid && v$.formData.firstName.$error">Имя обязательно</span>
      <span class="error-msg" v-if="v$.formData.firstName.minLength.$invalid && v$.formData.firstName.$error">Минимальная длина 2 символа</span>
    </div>
    <div class="c-input">
      <input
        type="text"
        v-model.trim="v$.formData.lastName.$model"
        :class="{ invalid: v$.formData.lastName.$error }"
        placeholder="Фамилия"
        name="lastName"
      >
      <span class="error-msg" v-if="v$.formData.lastName.required.$invalid && v$.formData.lastName.$error">Фамилия обязательна</span>
      <span class="error-msg" v-if="v$.formData.lastName.minLength.$invalid && v$.formData.lastName.$error">Минимальная длина 2 символа</span>
    </div>
    <div class="c-input">
      <input
        type="tel"
        :class="{ invalid: v$.formData.phone.$error }"
        placeholder="Телефон"
        v-model.trim="v$.formData.phone.$model"
        name="phone"
      >
      <span class="error-msg" v-if="v$.formData.phone.required.$invalid && v$.formData.phone.$error">Телефон обязателен</span>
      <span class="error-msg" v-if="v$.formData.phone.numeric.$invalid && v$.formData.phone.$error">Только цифры</span>
      <span class="error-msg" v-if="v$.formData.phone.minLength.$invalid && v$.formData.phone.$error">Минимальная длина 10 символов</span>
      <span class="error-msg" v-if="v$.formData.phone.maxLength.$invalid && v$.formData.phone.$error">Максимальная длина 15 символов</span>
    </div>
    <div class="c-input">
      <input
        type="email"
        :class="{ invalid: v$.formData.email.$error }"
        placeholder="Email"
        v-model.trim="v$.formData.email.$model"
        name="email"
      >
      <span class="error-msg" v-if="v$.formData.email.required.$invalid && v$.formData.email.$error">Почта обязательна</span>
      <span class="error-msg" v-if="v$.formData.email.email.$invalid && v$.formData.email.$error">Неверный формат почты</span>
    </div>
    <div class="c-input">
      <input
        type="text"
        :class="{ invalid: v$.formData.city.$error }"
        placeholder="Город"
        v-model.trim="v$.formData.city.$model"
        name="city"
      >
      <span class="error-msg" v-if="v$.formData.city.required.$invalid && v$.formData.city.$error">Поле обязательно</span>
      <span class="error-msg" v-if="v$.formData.city.minLength.$invalid && v$.formData.city.$error">Минимальная длина 3 символа</span>
    </div>
    <div class="c-input">
      <input
        type="text"
        :class="{ invalid: v$.formData.address.$error }"
        placeholder="Отделение почты"
        v-model.trim="v$.formData.address.$model"
        name="address"
      >
      <span class="error-msg" v-if="v$.formData.address.required.$invalid && v$.formData.address.$error">Поле обязательно</span>
      <span class="error-msg" v-if="v$.formData.address.minLength.$invalid && v$.formData.address.$error">Минимальная длина 2 символа</span>
    </div>

    <div class="c-form__submit">
      <button type="submit" class="u-btn is-black is-medium" :disabled="requestInProgress">Отправить</button>
    </div>
    <div class="c-load-icon js-load-more-icon">
      <UiCSpinner />
    </div>
  </form>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, maxLength, helpers } from '@vuelidate/validators'

const props = defineProps({
  popupData: { type: Object },
})

const { requestInProgress, waitRequest } = useWaitRequest()

const formData = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  address: '',
})

const rules = {
  formData: {
    firstName: { required, minLength: minLength(2) },
    lastName: { required, minLength: minLength(2) },
    email: { required, email },
    phone: {
      required,
      numeric: helpers.regex(/^[0-9]+$/),
      minLength: minLength(10),
      maxLength: maxLength(15),
    },
    city: { required, minLength: minLength(3) },
    address: { required, minLength: minLength(2) },
  },
}

const v$ = useVuelidate(rules, { formData })

const product = computed(() => props.popupData?.product)

async function submitForm() {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  waitRequest(async () => {
    try {
      await $fetch('/api/cart/create_order', {
        method: 'POST',
        body: {
          products: [product.value],
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          address: formData.address,
        },
      })
      formData.firstName = ''
      formData.lastName = ''
      formData.phone = ''
      formData.email = ''
      formData.city = ''
      formData.address = ''
      v$.value.$reset()
    } catch (error) {
      console.error(error)
    }
  })
}
</script>

<style lang="scss">
@import "~/assets/scss/components/form.scss";
</style>
