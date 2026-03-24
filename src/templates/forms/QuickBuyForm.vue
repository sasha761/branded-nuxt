<template>
  <form @submit.prevent="submitForm" class="c-form" name="quick-buy">
    <div class="c-input">
      <input 
        type="text" 
        v-model.trim="$v.formData.firstName.$model" 
        :class="{ 'invalid': $v.formData.firstName.$error }" 
        placeholder="Name"  
        name="name"
      >
      <span class="error-msg" v-if="!$v.formData.firstName.required && $v.formData.firstName.$error">Имя обязательно</span>
      <span class="error-msg" v-if="!$v.formData.firstName.minLength && $v.formData.firstName.$error">Минимальная длина 2 символа</span>
    </div>
    <div class="c-input">
      <input 
        type="text" 
        v-model.trim="$v.formData.lastName.$model" 
        :class="{ 'invalid': $v.formData.lastName.$error }" 
        placeholder="lastName" 
        name="lastName"
      >
      <span class="error-msg" v-if="!$v.formData.lastName.required && $v.formData.lastName.$error">Фамилия обязательна</span>
      <span class="error-msg" v-if="!$v.formData.lastName.minLength && $v.formData.lastName.$error">Минимальная длина 2 символа</span>
    </div>
    <div class="c-input">
      <input 
        type="tel" 
        :class="{ 'invalid': $v.formData.phone.$error }" 
        placeholder="Phone" 
        v-model.trim="$v.formData.phone.$model" 
        name="phone"
      >
      <span class="error-msg" v-if="!$v.formData.phone.required && $v.formData.phone.$error">Телефон обязателен</span>
      <span class="error-msg" v-if="!$v.formData.phone.numeric && $v.formData.phone.$error">Только цифры</span>
      <span class="error-msg" v-if="!$v.formData.phone.minLength && $v.formData.phone.$error">Минимальная длина 10 символов</span>
      <span class="error-msg" v-if="!$v.formData.phone.maxLength && $v.formData.phone.$error">Максимальная длина 15 символов</span>
    </div>
    <div class="c-input">
      <input 
        type="email" 
        :class="{ 'invalid': $v.formData.email.$error }" 
        placeholder="Email" 
        v-model.trim="$v.formData.email.$model" 
        name="email"
      >
      <span class="error-msg" v-if="!$v.formData.email.required && $v.formData.email.$error">Почта обязательна</span>
      <span class="error-msg" v-if="!$v.formData.email.email && $v.formData.email.$error">Неверный формат почты</span>
    </div>
    <div class="c-input">
      <input 
        type="text" 
        :class="{ 'invalid': $v.formData.city.$error }" 
        placeholder="City" 
        v-model.trim="$v.formData.city.$model" 
        name="city"
      >
      <span class="error-msg" v-if="!$v.formData.city.required && $v.formData.city.$error">Поле обязательно</span>
      <span class="error-msg" v-if="!$v.formData.city.minLength && $v.formData.city.$error">Минимальная длина 3 символов</span>
    </div>
    <div class="c-input">
      <input 
        type="text" 
        :class="{ 'invalid': $v.formData.post.$error }" 
        placeholder="Post Office" 
        v-model.trim="$v.formData.post.$model" 
        name="address"
      >
      <span class="error-msg" v-if="!$v.formData.post.required && $v.formData.post.$error">Поле обязательно</span>
      <span class="error-msg" v-if="!$v.formData.post.minLength && $v.formData.post.$error">Минимальная длина 2 символов</span>
    </div>

    <div class="c-form__submit">
      <button type="submit" class="u-btn is-black is-medium" :disabled="requestInProgress">Send</button>
    </div>
    <div class="c-load-icon js-load-more-icon">
      <CSpinner />
    </div>
    <div class="js-form-answer"></div>

  </form>
</template>



<script>
import Api from '@/api/Axios'
import {
  required,
  email,
  minLength,
  maxLength,
  helpers,
} from "vuelidate/lib/validators";


import CSpinner from '@/templates/components/C-Spinner.vue';

import waitRequest from '@/mixins/waitRequest';


export default {  
  data() {
    return {
      formData: {
        firstName: '',
        lastName: '',
        phone: null,
        email: null,
        city: null,
        post: null,
      },
    }
  },

  mixins: [waitRequest],

  validations: {
    formData: {
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
  },

  components: {
    CSpinner
  },

  props: {
    popupData: {
      type: Object
    }
  },

  computed: {
    product() {
      return this.popupData?.product
    },
  },  

  methods: {
    submitForm() {
      this.$v.$touch();

      if (this.$v.$invalid) return;

      this.waitRequest(() => {
        return Api.post('cart/create_order', {
          products: [this.product],
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          phone: this.formData.phone,
          email: this.formData.email,
          city: this.formData.city,
          post: this.formData.post
        })
        .then(() => {
          this.formData.products = [];
          this.formData.firstName = null;
          this.formData.lastName = null;
          this.formData.phone = null;
          this.formData.email = null;
          this.formData.city = null;
          this.formData.post = null;
          this.$v.$reset();
        })
        .catch((error) => {
          console.log(error);
        })
      });
    },
  }
}
</script>