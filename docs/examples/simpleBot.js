const VKCOINAPI = require('nodejs-vkcoin-api') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'Merchant Key',
  userId: 1,
  token: 'VK Auth Token',
})

const { VK } = require('vk-io') // Node.JS VK API Init
const vk = new VK()

vk.setOptions({
  token: 'VK Group Token',
})

vk.updates.on(['new_message'], async (msg) => {
  if (msg.isOutbox) return

  if (msg.text === 'мой баланс') { // Сравнение сообщений
    const result = await vkcoin.api.getBalance([ msg.senderId ]) // Получение баланса отправителя
    const coins = vkcoin.api.formatCoins(result.response[msg.senderId]) // Форматирование баланса

    return msg.send(`Ваши коины: ${coins}`) // Отправка сообщения
  }
})

vk.updates.startPolling()
