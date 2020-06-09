const dec2hex = (number) => {
  if (number < 0) {
    number = 0xFFFFFFFF + number + 1
  }

  return parseInt(number, 10).toString(16)
}

class Utils {
  constructor(userId) {
    this.userId = userId
  }

  /**
   * @description Форматирует количетсво коинов (ex: 1234567890 -> 1 234 567,890)
   * @param {Number} coins Количество коинов для форматирования
   * @returns {String} Отформатированное количество коинов
   */
  splitAmount(coins) {
    if (typeof coins !== 'number') coins = parseInt(coins, 10)
    if (coins == null || isNaN(coins)) {
      throw new Error('You must specify coins as a number or string.')
    }

    return coins.toLocaleString('en-US').replace(/,/g, ' ')
  }

  /**
   * @description Генерация ссылки на перевод
   * @param {Object} object Объект с параметрами для генерации ссылки
   * @param {Number} amount? Количество коинов для перевода
   * @returns {String} Ссылка для пополнения платежного пользователя
   */
  getLink({ amount = 100000000, fixation = false, payload, hex = false }) {
    if (typeof amount !== 'number') {
      throw new Error('Amount must be an integer')
    }

    if (payload == null) {
      payload = Math.round(-2000000000 - 0.5 + Math.random() * 4000000001)
    }

    return `vk.com/coin#${hex ? 'm' : 'x'}${hex ? dec2hex(this.userId) : userId}_${hex ? dec2hex(amount) : amount}_${hex ? dec2hex(payload) : payload}${fixation ? '' : '_1'}`
  }
}

module.exports = Utils
