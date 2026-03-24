<template>
  <section class="l-subs">
    <img
      class="is-img"
      src="@/assets/img/subs.jpg"
      alt="Подписаться на украинских производителей Branded"
      width="1920"
      height="647"
    />
    <div class="u-container">
      <form class="c-form js-form-register">
        <div class="c-form__title"><div class="u-h3">Будь в теме</div></div>
        <div class="c-form__checkbox">
          <div class="c-checkbox">
            <input type="checkbox" value="man" name="gender" />
            <p>мужчинам</p>
          </div>
          <div class="c-checkbox">
            <input type="checkbox" value="wooman" name="gender" />
            <p>женщинам</p>
          </div>
        </div>
        <div class="c-form__bottom">
          <input type="email" placeholder="Email" name="email" required="" />
          <input type="hidden" name="action" value="subscribe" />
          <button type="submit" class="u-btn is-black">Подписаться</button>
          <div class="js-form-answer"></div>
        </div>
      </form>
    </div>
  </section>
</template>
