const VKCOINAPI = require('node-vkcoinapi') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'ключ',
  userId: 236908027,
  token: 'токен',
})

vkcoin.updates.startWebHook({
  url: 'fakeman-cat.tk', // URL / Public IP
  port: 8181, // Port
})

vkcoin.updates.onTransfer((event) => {
  const { amount, fromId, id } = event

  /**
     * amount - количество коинов, которые поступили
     * fromId - ID отправителя
     * id - ID платежа
  */

  const score = vkcoin.formatCoins(amount)

  console.log(
    `Поступил платёж (${id}) от https://vk.com/id${fromId} в размере ${score} коинов`
  )
})
