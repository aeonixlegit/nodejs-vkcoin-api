const fetch = require('node-fetch')

class API {
  constructor (key, merchantId) {
    this.key = key
    this.merchantId = merchantId
  }

  /**
   * @description Прямой вызов функции через API.
   * @param {String} method Метод для перевода, в документации указан после /merchant/
   * @param {Object} params Параметры для перевода, key и merchantId указываются автоматически
   */

  async call (method, params) {
    if (!method) {
      throw new Error('Не указан метод для запроса к API')
    }

    if (!params) {
      throw new Error('Не указаны параметры для запроса к API')
    }

    const requestBody = {
      key: this.key,
      merchantId: this.merchantId,
      ...params
    }

    const response = await fetch(`https://coin-without-bugs.vkforms.ru/merchant/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const json = await response.json()
    return json
  }

  /**
   * @description Получить историю переводов на аккаунт платежного пользователя
   * @param {Array} tx [1] для получшения последней тысячи транзакий, [2] для получшения последней сотни транзакций
   * @param {Number} lastTx Необязательно: номер последнего перевода
   * @default tx [1]
   */

  async getTransactionList (tx = [1], lastTx) {
    const { response } = await this.call('tx', { tx, lastTx })

    return response
  }

  /**
   * @description На указанный адрес будут отправляться уведомления о новых переводах совершенных только по сец. ссылкам. Чтобы удалить адрес передайте в параметре callback значение null. Вызывать этот метод можно 1 раз в 15 секунд.
   * @param {String} callback Необязательно: Значение для установки ссылки WebHook
   */

  async setCallback (callback) {
    const { response } = await this.call('set', callback)

    return response
  }

  /**
   * @description Устанавливает название магазина (видно при переводах)
   * @param {String} name Название магазина
   */

  async setShopName (name) {
    const { response } = await this.call('set', { name })

    return response
  }

  /**
   * @description Перевод VKC со счета платежного пользователя
   * @param {Number} toId Уникальный идентивикатор получателя во ВКонтакте
   * @param {Number} amount Сумма для перевода
   * @param {Boolean} markAsMerchant Отправлять ли платеж не от имени пользователя?
   * @default markAsMerchant false
   */

  async transfer (toId, amount, markAsMerchant = true) {
    const { response } = await this.call('send', { toId, amount, markAsMerchant })

    return response
  }

  /**
   * @description Получение баланса пользователя
   * @param {Array} userIds Необязательно: массив из уникальных идентификаторов пользователей ВКонтакте
   * @default userIds Платежный пользователь
   */

  async getBalance(userIds = [this.merchantId]) {
    const { response } = await this.call('score', { userIds })

    return userIds.length === 1 ? response[userIds[0]] : response
  }
}

module.exports = API
