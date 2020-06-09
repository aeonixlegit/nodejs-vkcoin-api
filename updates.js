const fetch = require('node-fetch')

const EventEmitter = require('events')
const WebSocket = require('ws')

const pass = (arg1, arg2) => arg1 + arg2 - 1

const formatLink = (inputURL, userId) => {
  const info = new URL(inputURL)

  const link = info.protocol.replace('https:', 'wss:').replace('http:', 'ws:') + `//${info.host}/channel/`
  const urlws = `${link}${userId % 32}/${info.search}&ver=1&upd=1&pass=${pass(userId, 0)}`

  return urlws
}

async function getUrlByToken(token) {
  const response = await fetch(`https://api.vk.com/method/apps.get?access_token=${token}&app_id=6915965&v=5.107`)

  const json = await response.json()

  if (json.error) {
    throw new Error(
      'Не удалось получить ссылку на приложение. Попробуйте переполучить токен'
    )
  }

  const { mobile_iframe_url } = json.response.items[0]

  if (!mobile_iframe_url) {
    throw new Error(
      'Токен нужно получить от приложения "Клевер"'
    )
  }

  return mobile_iframe_url
}

class Updates extends EventEmitter {
  /**
   * @description Конструктор класса обновлений
   * @param {String} key Ключ для доступка к API VK Coin
   * @param {String} userToken Токен пользователя
   * @param {Number} userId Уникальный идентификатор пользователя во ВКонтакте
   */
  constructor(key, userToken, userId) {
    super()

    this.key = key
    this.userToken = userToken
    this.userId = userId

    this.pollingUrl = ''

    this.reconnectTimeout = 5000

    this.isStarted = false
  }

  async startPolling() {
    if (!this.userToken) {
      throw new Error('Не указан токен пользователя для запуска polling.')
    }

    if (!this.pollingUrl) {
      const appUrl = await getUrlByToken(this.userToken)
      this.pollingUrl = formatLink(appUrl, this.userId)
    }

    this.isStarted = true

    this.ws = new WebSocket(this.pollingUrl)

    this.ws.on('error', () => {
      setTimeout(() => this.reconnect(), this.reconnectTimeout)
    })

    this.ws.on('message', (message) => {
      if (message[0] === '{') {
        const jsonMessage = JSON.parse(message)

        if (jsonMessage.type === 'INIT') {
          this.place = jsonMessage.place;
          this.digits = jsonMessage.digits;
          this.online = jsonMessage.top.online;
          this.userTop = jsonMessage.top.userTop;
          this.groupTop = jsonMessage.top.groupTop;
        }
      }

      if (message.startsWith('TR')) {
        const { amount, fromId, id } = message.match(
          /^(?:TR)\s(?<amount>.*)\s(?<fromId>.*)\s(?<id>.*)/i
        ).groups;

        this.emit('transfer', {
          id: Number(id),
          amount: Number(amount),
          fromId: Number(fromId)
        })
      }
    })

    this.ws.on('close', () => {
      setTimeout(() => this.reconnect(), this.reconnectTimeout)
    })
  }

  reconnect() {
    return this.startPolling()
  }

  onTransfer(callback) {
    this.on('transfer', callback)
  }
}

module.exports = Updates
