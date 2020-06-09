const VKCoin = require('../../index') // Замените '../../index' на 'nodejs-vkcoin-api'

const vkc = new VKCoin({
  key: 'N0d3.JsVkCo1nAP1',
  userId: 1,
  token: 'beefb3efb33fbe3f',
})

;(async () => {
  const balances = await vkc.api.getBalance([ 1, 100, 333 ])
  const myBalance = await vkc.api.getBalance()

  console.log({ balances, myBalance })
})()
