const VKCOINAPI = require('nodejs-vkcoin-api') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'Merchant Key',
  userId: 1,
  token: 'VK Auth Token',
})

async function run () {
  await vkcoin.updates.startPolling()

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
}

run().catch(console.error)
