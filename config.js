/* ===== Настройки сайта «Мастерская YMi» — редактируйте здесь ===== */
window.YMI_CONFIG = {
  PHONE_DISPLAY: "+7 926 670-16-49",
  PHONE_RAW: "79266701649",
  EMAIL: "yevlampieva.ccm@gmail.com",

  /* Отправка заказов в Telegram. Выберите ОДИН вариант (по приоритету):
     1) ORDER_ENDPOINT — адрес вашего Cloudflare Worker (см. файл worker/telegram-worker.js). Токен бота спрятан. РЕКОМЕНДУЕТСЯ.
     2) BOT_TOKEN + CHAT_ID — прямая отправка через бота (токен будет виден в коде сайта).
     3) Если ничего не заполнено — заказ открывается в Telegram готовым сообщением на номер мастера
        (клиент нажимает «Отправить»). Работает сразу, без настройки. */
  TELEGRAM: {
    ORDER_ENDPOINT: "",
    BOT_TOKEN: "",
    CHAT_ID: "",
    FALLBACK_LINK: "https://t.me/+79266701649"
  }
};
