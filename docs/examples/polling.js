const VKCOINAPI = require('nodejs-vkcoin-api') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'Merchant Key',
  userId: 1,
  token: 'VK Auth Token',
})

async function run () {
  await vkcoin.updates.startPolling()

  vkcoin.updates.onTransfer(async (from, score, id) => {
    /**
       * from - ID отправителя
       * score - количество коинов, которые поступили
       * id - ID платежа
    */

    const amount = vkcoin.formatCoins(score)

    console.log(
      `Поступил платёж (${id}) от https://vk.com/id${from} в размере ${amount} коинов`
    )
  })
}

run().catch(console.error)
