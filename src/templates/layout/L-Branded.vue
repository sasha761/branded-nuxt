<template>
  <section class="l-branded">
    <div
      class="l-branded__img d-lg-block d-none"
      :style="{ 'background-image': `url(${require('@/assets/img/9130.jpg')})` }"
    ></div>
    
    <div class="u-container">
      <div class="l-branded__content">
        <div class="l-branded__head">
          <div class="l-branded__head-text">
            <div  class="c-logo">
              <router-link to="/">
                <svg width="310px" height="68px">
                  <use xlink:href="#logo"></use>
                </svg>
              </router-link>

              <p>The territory of your style and comfort</p>
            </div>
            <p>Мы объединяем восходящие модные бренды. Наша площадка гарантирует покупателям качество товара и сроки доставки, а производителям - великолепное представление своего ассортимента. Пальто, юбки, платья, пиджаки, джинсы и обувь. Все самое трендовое на одной торговой площадке. </p>
            <p>Ми об'єднуємо висхідні модні бренди. Наш майданчик гарантує покупцям якість товару та терміни доставки, а виробникам – чудове представлення свого асортименту. Пальто, спідниці, сукні, піджаки, джинси та взуття. Все трендове на одному торговому майданчику. </p>
          </div>
          <div class="c-appeal">
            <span class="is-number">15</span>
            <p class="u-h3">brands</p>
            <p class="u-h4">already in our community</p>
            <a href="#" class="u-btn is-orange">sign up</a>
          </div>
        </div>
        <div class="l-branded__products d-none d-sm-block">
          <div class="row">
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img 
                    src="@/assets/img/223.png"
                    alt="branded product" 
                    width="300" 
                    height="450"
                  >
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img 
                    src="@/assets/img/224.png"
                    alt="branded product" 
                    width="300" 
                    height="450"
                  >
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img 
                    src="@/assets/img/225.png"
                    alt="branded product" 
                    width="300" 
                    height="450"
                  >
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img 
                    src="@/assets/img/2221.png"
                    alt="branded product"
                    width="300" 
                    height="450"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>