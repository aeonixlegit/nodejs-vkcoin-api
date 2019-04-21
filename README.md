<br />
<p align="center">
  <h3 align="center">Node.JS VKCoin API</h3>
  <p align="center">
    Node.JS API для работы с приложением ВКонакте <a href="https://vk.com/coin">VK Coin</a>
    <br />
    <a href="https://github.com/cursedseal/Node.JS-VK-Coin-API"><strong>Начни использовать сейчас »</strong></a>
    <br />
    <br />
    <a href="https://github.com/cursedseal/Node.JS-VK-Coin-API/issues">Report Bug</a>
    ·
    <a href="https://github.com/cursedseal/Node.JS-VK-Coin-API/issues">Request Feature</a>
  </p>
</p>

# Установка

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/5de8b0849d9a4437b85ed29c82a92a81)](https://app.codacy.com/app/aeonixlegit/Node.JS-VK-Coin-API?utm_source=github.com&utm_medium=referral&utm_content=aeonixlegit/Node.JS-VK-Coin-API&utm_campaign=Badge_Grade_Dashboard)

* Скачайте и произведите установку последней версии [Node.JS](https://nodejs.org/)
* С помощью терминала произведите установку библиотеки: `npm i nodejs-vkcoin-api`

# Начало работы
В новом JavaScirpt файле произведите подключите уставновленную библиотеку.
```js
const VKCoinAPI = require('nodejs-vkcoin-api');
const vkcoin = new VKCoinAPI(options = {});
```
|Опция|Тип|Описание|
|-|-|-|
|key|String|[Ваш Merchant Key для взаимодействия с API](https://vk.com/@hs-marchant-api)|
|userId|Number|Цифровой идентификатор (ID) пользователя, через которого Вы будете авторизовываться|
|token|String|Access Token пользователя, через которого Вы будете авторизовываться|

# Методы
getTransactionList - Получает список ваших транзакций

```js
async function run() {
  const result = await vkcoin.getTransactionList(tx)

  console.log(result)
}

await run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|tx|Array<Number>|Массив для получения ID последних переводов ИЛИ [1] - для отображения последней тысячи переводов, [2] - для отображения последней сотни переводов|
#
sendPayment - Перевод VK Coins пользователю.

```js
async function run() {
  const result = await vkcoin.sendPayment(toId, amount)

  console.log(result)
}

await run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|toId|Number|Цифровой идентификатор (ID) получателя|
|amount|Number|Сумма перевода без учета запятой|
#
getLink - Получение ссылки для получения переводов VK Coins

```js
function run() {
  const link = vkcoin.getLink(amount, fixation)

  console.log(link)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|amount|Number|Сумма перевода без учета запятой|
|fixation|Boolean|Является ли сумма фиксированной?|
#
formatCoins - Форматирует VK Coins в более приятную для глаз. Например: 1234567890 -> 1 234 567,890
```js
async function run() {
  const trans = await vkcoin.getTransactionList([2])

  const fixTrans = trans.response.map((tran) => {
    tran.amount = vkcoin.formatCoins(tran.amount)

    return tran
  })

  console.log(fixTrans)
}

await run().catch(console.error)
```
|Параметр|Тип|Описание|
|-|-|-|
|coins|Number|Входящее значение коинов|
#
getBalance - Получает баланс пользователей по их цифорвому идентификатору (ID).

getMyBalance - Получает баланс авторизированного пользователя

```js
async function run() {
  const balances = await vkcoin.getBalance([1, 100, 236908027])
  const myBalance = await vkcoin.getMyBalance()

  console.log({ balances, myBalance })
}

await run().catch(console.error)
```

Среди этих методов аргумент принимает только getBalance:

|Параметр|Тип|Описание|
|-|-|-|
|userIds|Array<Number>|Массив айди пользователей|
# Updates
**updates** - Позволяет "прослушивать" события в VK Coin. Пока что я реализовал перехват входящего платежа, но вскоре придумаю что-нибудь ещё. И да, впервые работаю с сокетами :)
### Запуск
Для запуска прослушивания есть 2 метода: startPolling и startWebHook
#
startPolling - Запускает обмен запросами между клиентом и сервером в режиме реального времени (WebSocket). Является лучшим и быстрым способом получения событий:

```js
async function run() {
  await vkcoin.updates.startPolling(callback)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|callback|Function|Функция обратного вызова, принимает в себя аргумент **data**|

|Опция|Тип|Описание|
|-|-|-|
|url|String|Адрес вашего сервера для получения событий|
|port|Number|Порт для запуска сервера (8181 - по умолчанию)|
# События
updates.onTransfer - Перехватывает входящие платежи, принимает один аргумент

```js
async function run() {
  await vkcoin.updates.startPolling()

  vkcoin.updates.onTransfer(async (from, score, id) => {
    console.log({ from, score, id })
  })
}

run().catch(console.error)
```

Или же данный перехват можно использовать совместно с CallBack:

```js
vkcoin.updates.startPolling(async(data) => {
  console.log(data)

  vkcoin.updates.onTransfer(async (from, score, id) => {
    console.log({ from, score, id })
  })
})
```
