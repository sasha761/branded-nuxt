<template>
  <section class="l-comments">
    <div class="u-container">
      <div class="row">
        <div class="col-lg-8">
          <div class="c-comments comment-respond" id="respond">
            <h3 class="u-h4">Отзывы: 0</h3>
            <div class="c-comments__box"></div>
            <form class="comment-form" id="commentform" method="post">
              <div class="c-comments__registration">
                <div class="c-comments__registration-label">
                  Оценка* <br />
                  <div class="comment-form-rating">
                    <select name="rating" id="rating" required>
                      <option value="">Оценка…</option>
                      <option value="5">Отлично</option>
                      <option value="4">Хорошо</option>
                      <option value="3">Средне</option>
                      <option value="2">Неплохо</option>
                      <option value="1">Очень плохо</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="c-comments__submit">
                <input type="text" name="comment" required placeholder="Ваш комментарий" />
                <button class="u-btn is-medium is-black" type="submit" name="Submit">
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
@import "~/assets/scss/components/comments.scss";
</style>