const VKCOINAPI = require('nodejs-vkcoin-api') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'Merchant Key',
  userId: 1,
  token: 'VK Auth Token',
})

async function run () {
  const transactions = await vkcoin.api.getTransactionList([2]) // Получение последних 100 транзакций.
  const balances = await vkcoin.api.getBalance([1, 2, 3, 4, 5]) // Получение баланса пользователей с ID 1, 2, 3, 4, 5, можно указать до 100 ID одновременно.
  const myBalance = await vkcoin.api.getMyBalance() // Получение баланса текущего пользователя.
  const result = await vkcoin.api.sendPayment(1, 1000) // Отправка одного VK Coin пользователю с ID 1.
  const link = vkcoin.api.getLink(10000, true, false) // Получение ссылки на отправку платежа (10,000 коинов без возможности изменения)

  console.log({
    transactions,
    balances,
    myBalance,
    result,
    link,
  }) // Вывод результата
}

run().catch(console.error)
