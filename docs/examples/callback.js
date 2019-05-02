const VKCOINAPI = require('nodejs-vkcoin-api') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'ключ',
  userId: 236908027,
  token: 'токен',
})

vkcoin.updates.startWebHook({
  url: 'myawesomevds.to', // URL / Public IP
  port: 8181, // Port
})

vkcoin.updates.onTransfer(async (from, score, id) => {
  /**
     * from - ID отправителя
     * score - количество коинов, которые поступили
     * id - ID платежа
  */

  const amount = vkcoin.api.formatCoins(score)

  console.log(
    `Поступил платёж (${id}) от https://vk.com/id${from} в размере ${amount} коинов`
  )
})
