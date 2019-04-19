const VKCOINAPI = require('node-vkcoinapi') // Libary Init

const vkcoin = new VKCOINAPI({
  key: 'Merchant Key',
  userId: 1,
  token: 'VK Auth Token',
})

async function run () {
  const transactions = await vkcoin.getTransactionList([2]) // Получение последних 100 транзакций.
  const balances = await vkcoin.getBalance([1, 2, 3, 4, 5]) // Получение баланса пользователей с ID 1, 2, 3, 4, 5, можно указать до 100 ID одновременно.
  const myBalance = await vkcoin.getMyBalance() // Получение баланса текущего пользователя.
  const result = await vkcoin.sendPayment(1, 1000) // Отправка одного VK Coin пользователю с ID 1.
  const link = vkcoin.getLink(10000, true) // Получение ссылки на отправку платежа (10,000 коинов без возможности изменения)

  console.log({
    transactions,
    balances,
    myBalance,
    result,
    link,
  }) // Вывод результата
}

run().catch(console.error)
