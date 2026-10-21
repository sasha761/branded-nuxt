<template>
  <form @submit.prevent="submitForm" class="c-form" name="quick-buy" novalidate>
    <template v-if="size?.attributes?.length">
      <p v-for="attribute in size.attributes" :key="attribute.label" class="c-form__size">
        {{ attribute.label }}: <b>{{ attribute.value }}</b>
      </p>
    </template>
    <p v-else-if="sizeName" class="c-form__size">{{ t('size') }}: <b>{{ sizeName }}</b></p>

    <div v-for="field in fields" :key="field.name" class="c-input">
      <input
        :type="field.type"
        v-model.trim="v$.formData[field.name].$model"
        :class="{ invalid: fieldError(field.name) }"
        :placeholder="field.placeholder"
        :name="field.name"
        :autocomplete="field.autocomplete"
        :inputmode="field.inputmode"
      >
      <span class="error-msg" v-if="fieldError(field.name)">{{ fieldError(field.name) }}</span>
    </div>

    <input v-model="formData.website" class="u-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">

    <p v-if="formError" class="c-form-error">{{ formError }}</p>

    <div class="c-form__submit">
      <button type="submit" class="u-btn is-black is-medium" :disabled="requestInProgress">{{ t('send') }}</button>
    </div>
    <div v-if="requestInProgress" class="c-load-icon js-load-more-icon">
      <UiCSpinner />
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  // { product, size } — товар со страницы и выбранная вариация (SelectedVariation или прежний размер)
  popupData: { type: Object },
})

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const { close } = usePopup()

const product = computed(() => props.popupData?.product)
const size = computed(() => props.popupData?.size || null)
const sizeName = computed(() => (size.value?.name && size.value.name !== 'one size' ? size.value.name : ''))

const { formData, v$, fieldError, formError, submit, requestInProgress } = useOrderForm(() => [{
  id: product.value?.id,
  size_selected: [{ id: size.value?.id || product.value?.id }],
  variation: size.value?.variation,
  quantity: 1,
}])

const fields = computed(() => [
  { name: 'firstName', type: 'text', placeholder: t('form_fields.first_name'), autocomplete: 'given-name' },
  { name: 'lastName', type: 'text', placeholder: t('form_fields.last_name'), autocomplete: 'family-name' },
  { name: 'phone', type: 'tel', placeholder: t('form_fields.phone'), autocomplete: 'tel', inputmode: 'tel' },
  { name: 'email', type: 'email', placeholder: 'Email', autocomplete: 'email' },
  { name: 'city', type: 'text', placeholder: t('form_fields.city'), autocomplete: 'address-level2' },
  { name: 'address', type: 'text', placeholder: t('form_fields.address') },
])

async function submitForm() {
  const order = await submit()
  if (!order) return

  close()
  await router.push(localePath({ path: `/order-received/${order.id}/`, query: { key: order.key } }))
}
</script>

<style lang="scss">
@import "~/assets/scss/components/form.scss";
@import "~/assets/scss/components/input.scss";
</style>
