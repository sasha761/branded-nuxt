<template>
  <main class="p-page">
		<C-PageLoader v-if="requestInProgress"/>
		<div class="u-container" v-if="content">
			<div class="row">
				<div class="col-lg-3 col-md-3 col-12 u-col">
					<div class="l-sidebar">
						<ul>
              <li v-for="page in content?.related_pages" :key="page.ID">
                <router-link :to="stripDomain(page.link)">{{page.title}}</router-link>
              </li>
						</ul>
						<div class="l-sidebar__contact">
							<!-- {% if current_lang == 'ru' %}
								<p>Не нашли ответ на вопрос? <br> Свяжитесь с нами:</p>
							{% elseif current_lang == 'uk' %}
								<p>Не знайшли відповідь на запитання? <br> Зв'яжіться з нами:</p>
							{% endif %} -->
							<!-- <a href="tel:{{ options.social.phone|replace({' ': ''}) }}">{{ options.social.phone }}</a> -->
							<a href="mailto:branded.own@gmail.com">branded.own@gmail.com</a>
							<p>Пн-Пт 9:00 – 21:00 <br> Сб-Вс 9:00 – 19:00</p>
						</div>
					</div>
				</div>
				<div class="col-lg-9 col-md-9 col-12 u-col">
					<div class="p-page__content">
						<h1 class="p-page__title u-h2">{{content?.page?.title}}</h1>
						<div class="p-page__content-text" v-html="content?.page?.content"></div>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>
<script>

import Api from '@/api/Axios';
import waitRequest from '@/mixins/waitRequest';
import CPageLoader from '@/templates/components/C-PageLoader.vue';
import { stripDomain, stripLang } from '@/assets/js/utils.js';
import { mapGetters } from 'vuex';


export default {
  data() {
    return {
      content: {}
    }
  },

	components: {
    CPageLoader
  },

	mixins: [waitRequest],

	watch: {
    currentLang() {
      this.fetchPageData();
    }, 
	},

  mounted() {
		this.fetchPageData()
		console.log(this.$route);
  },

	computed: {
    ...mapGetters({
      currentLang: 'lang/getCurrentLang',
    }),
	},

  methods: {
		stripDomain,
		stripLang,

		fetchPageData() {
			this.waitRequest(() => {
				return Api.post('page/page', {
						url: this.$route.path,
						lang: this.currentLang
					})
					.then((result) => {
						this.content = result.data
						console.log(this.content)
					})
					.catch((error) => {
						console.log(error);
					});
			});
		}
  }
}
</script>