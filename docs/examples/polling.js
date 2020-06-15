const VKCoin = require('../../index') // Замените '../../index' на 'nodejs-vkcoin-api'

const vkc = new VKCoin({
  key: 'N0d3.JsVkCo1nAP1',
  userId: 1,
  token: 'beefb3efb33fbe3f',
})

vkc.updates.onTransfer((data) => {
  const { id, amount, fromId } = data
  console.log(`Поступил новый перевод от @id${fromId} в размере ${vkc.utils.splitAmount(amount / 1000)} VKC (ID перевода: ${id})`)
})

vkc.updates.startPolling()

const paymentUrl = vkc.utils.getLink({
  amount: 1000000,
  hex: true,
})

console.log(`Для перевода средств используйте ссылку ${paymentUrl}`)
