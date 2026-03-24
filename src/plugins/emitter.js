import Emitter from 'tiny-emitter';

const emitter = new Emitter();

const $eventBus = {
  $emit: emitter.emit,
  $on: emitter.on,
  $off: emitter.off,
  $once: emitter.once,
};

const $popup = {
  /**
   * Открыть попап
   * @param {string} name - Имя компонента попапа
   * @param {Object} data - Объект с данными прокидываемый в попап
   * @param {number} level - Уровень отображения попапа
   */
  open(name, data = {}, level = 1) {
    $eventBus.$emit(`popup:open${level}`, {
      name,
      data,
    });
  },

  /**
   * Добавить слушатель открытия попапа
   * @param {Object} settings -  Объект передаваемых настроек
   * @param {number} settings.level - Уровень отображения попапа
   * @param {Function} settings.callback - функция обратного вызова
   */
  onOpen({ level = 1, callback }) {
    $eventBus.$on(`popup:open${level}`, callback);
  },

  /**
   * Удалить слушатель открытия попапа
   * @param {Object} settings -  Объект передаваемых настроек
   * @param {number} settings.level - Уровень отображения попапа
   * @param {Function} settings.callback - функция обратного вызова
   */
  removeOpen({ level = 1, callback }) {
    $eventBus.$off(`popup:open${level}`, callback);
  },

  /**
   * Закрыть попап на уровне
   * @param {number} level - Уровень отображения попапа
   * @param {Function} callback - функция обратного вызова
   */
  close(level = 1, callback = null) {
    $eventBus.$emit(`popup:close${level}`, callback);
  },

  /**
   * Закрыть все попапы на всех уровнях
   * @param {Function} callback - функция обратного вызова
   */
  closeAll(callback = null) {
    $eventBus.$emit(`popup:closeAll`, callback);
  },

  /**
   * Добавить слушатель закрытия всех попапов на всех уровнях
   * @param {Function} callback - функция обратного вызова
   */
  onCloseAll(callback) {
    $eventBus.$on(`popup:closeAll`, callback);
  },

  /**
   * Удалить слушатель закрытия всех попапов на всех уровнях
   * @param {Function} callback - функция обратного вызова
   */
  removeCloseAll(callback) {
    $eventBus.$off(`popup:closeAll`, callback);
  },

  /**
   * Добавить слушатель закрытия попапа
   * @param {Object} settings -  Объект передаваемых настроек
   * @param {number} settings.level - Уровень отображения попапа
   * @param {Function} settings.callback - функция обратного вызова
   */
  onClose({ level = 1, callback }) {
    $eventBus.$on(`popup:close${level}`, callback);
  },

  /**
   * Удалить слушатель закрытия попапа
   * @param {Object} settings -  Объект передаваемых настроек
   * @param {number} settings.level - Уровень отображения попапа
   * @param {Function} settings.callback - функция обратного вызова
   */
  removeClose({ level = 1, callback }) {
    $eventBus.$off(`popup:close${level}`, callback);
  },

  /**
   * Проверяет необходимо ли установить на текущий попап фокус
   */
  checkFocus() {
    $eventBus.$emit(`popup:focus`);
  },

  /**
   * Добавить слушатель проверки необходимо ли установить на текущий попап фокус
   * @param {Function} callback - функция обратного вызова
   */
  onCheckFocus(callback) {
    $eventBus.$on(`popup:focus`, callback);
  },

  /**
   * Удалить слушатель проверки необходимо ли установить на текущий попап фокус
   * @param {Function} callback - функция обратного вызова
   */
  removeCheckFocus(callback) {
    $eventBus.$off(`popup:focus`, callback);
  },
};

// myPlugin.js

const MyPlugin = {
  install(app) {
    app.config.globalProperties.$popup = $popup;
  }
};

export default MyPlugin;