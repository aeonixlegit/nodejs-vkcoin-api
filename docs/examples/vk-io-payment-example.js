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

  if (msg.text === 'give me coins') { // Проверка на текст сообщения
    await vkcoin.api.sendPayment(msg.senderId, 1000000, true) // Отправка 1000,00 VK Coins пользователю от имени магазина

    return msg.send('Произведена отправка 1000,00 коинов на Ваш счет! ;)') // Отправка сообщения пользователю.
  }
})

vk.updates.startPolling()
