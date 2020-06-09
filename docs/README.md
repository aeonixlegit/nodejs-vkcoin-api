# Начало работы

В новом JavaScirpt файле произведите подключите уставновленную библиотеку.

```js
const VKCoinAPI = require('nodejs-vkcoin-api')

const vkcoin = new VKCoinAPI({
  token: 'Токен пользователя ВКонтакте',
  userId: 123,
  key: 'Merchant Key от VK Coin',
})
```

|Опция|Тип|Описание|
|-|-|-|
|key|String|[Ваш Merchant Key для взаимодействия с API](https://vk.com/@hs-marchant-api)|
|userId|Number|Цифровой идентификатор (ID) пользователя, через которого Вы будете авторизовываться|
|token|String|Access Token пользователя, через которого Вы будете авторизовываться|

## Методы

getTransactionList - Получает список ваших транзакций

```js
async function run () {
  const result = await vkcoin.api.getTransactionList(tx)

  console.log(result)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|tx|Array<Number>|Массив для получения ID последних переводов ИЛИ [1] - для отображения последней тысячи переводов, [2] - для отображения последней сотни переводов|

<hr>

transfer - Перевод VK Coins пользователю.

```js
async function run () {
  const result = await vkcoin.api.transfer(571954988, 10000, true)

  console.log(result)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|toId|Number|Цифровой идентификатор (ID) получателя|
|amount|Number|Сумма перевода без учета запятой|
|markAsMerchant|Boolean|Отправлять от имени магазина? (default:false)|

<hr>

getBalance - Получает баланс пользователей по их цифорвому идентификатору (ID), если не указать ID, будет использован ID платежного пользователя.

В случае запроса баланса одного пользователя, будет возвращен его баланс без ID.

```js
async function run () {
  const balances = await vkcoin.api.getBalance([1, 100, 571954988])
  const myBalance = await vkcoin.api.getBalance()

  console.log({ balances, myBalance })
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|userIds|Array<Number>|Необязательно: Массив, содержащий ID пользователей|

<hr>

setShopName - Изменяет название магазина

```js
async function run () {
  const result = await vkcoin.api.setShopName(name)

  console.log(result)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|name|String|Новое имя для магазина|

## Utils

**utils** - это дополнительный функционал в враппере, позволяющий форматировать коины и генерировать ссылку на перевод.

splitAmount - Форматирует VK Coins в более приятную для глаз. Например: 1234567890 -> 1 234 567,89

```js
async function run () {
  const trans = await vkcoin.api.getTransactionList([2])

  const fixTrans = trans.response.map((tran) => {
    tran.amount = vkcoin.utils.splitAmount(tran.amount)

    return tran
  })

  console.log(fixTrans)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|coins|Number|Входящее значение коинов|

<hr>

getLink - Генерация ссылки для получения переводов VK Coins

```js
function run () {
  const link = vkcoin.utils.generateLink({
    amount: 1000,
    fixation: true,
    hex: true,
   })

  console.log(link)
}

run().catch(console.error)
```

|Параметр|Тип|Описание|
|-|-|-|
|object|Object|Объект, содержащий следующие значения|
|object.amount|Number|Сумма перевода без учета запятой|
|object.fixation|Boolean|Является ли сумма фиксированной? (default: false)|
|object.hex|Boolean|Генерировать ссылку с HEX параметрами? (default: false)|
|object.payload|Number|Payload (default: random)|


## Updates

**updates** - Позволяет "прослушивать" события в VK Coin. Пока что я реализовал перехват входящего платежа, но вскоре придумаю что-нибудь ещё.

### Запуск

startPolling - Запускает обмен запросами между клиентом и сервером в режиме реального времени (WebSocket). Является лучшим и быстрым способом получения событий:

```js
async function run () {
  await vkcoin.updates.startPolling(callback)
}

run().catch(console.error)
```

## События

updates.onTransfer - Перехватывает входящие платежи, принимает один аргумент

```js
vkcoin.updates.onTransfer(async (from, score, id) => {
  console.log({ from, score, id })
})

vkcoin.updates.startPolling()
```
