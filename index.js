const WebSocket = require('ws')
const safeEval = require('safe-eval')

const dechex = require('./utils/dechex')
const isJSON = require('./utils/isJSON')
const random = require('./utils/random')
const request = require('./utils/request')
const formatURL = require('./utils/formatURL')
const getURLbyToken = require('./utils/getURLbyToken')

function OmyEval (pow) {
  let res = safeEval(pow, {
    window: {
      location: {
        host: 'vk.com',
      },
      navigator: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
      },
      WebSocket: true,
      Math,
      parseInt,
    },
  })

  return res
}

class Updates {
  /**
   * @param {String} key - VKCoins API Merchant Key
   * @param {String} token - VK API Auth Token
   * @param {Number} userId - VK User ID
   */
  constructor (key, token, userId) {
    this.key = key
    this.token = token
    this.userId = userId

    /* auto reconnect */
    this.allowReconnect = true
    this.callback = null
    this.callbackForPackId = {}
    this.connected = false
    this.connecting = false
    this.onConnectSend = []
    this.ttl = 0
    this.ws = null
    this.wsServer = ''
    this.retryTime = 1000

    /* user data */
    this.place = null
    this.digits = null
    this.online = null
    this.userTop = null
    this.groupTop = null
  }

  /**
   * @async
   * @description Start VKAPI real-time pooling
   * @param callback - Callback
   */
  async startPolling (callback) {
    const url = await getURLbyToken(this.token)
    const wsURL = formatURL(url, this.userId)

    this.run(wsURL, callback)
  }

  run (wsServer, callback) {
    this.wsServer = wsServer || this.wsServer
    this.selfClose()

    if (callback) this.callback = callback

    try {
      this.ws = new WebSocket(this.wsServer)

      this.ws.onopen = _ => {
        this.connected = true
        this.connecting = false

        for (let packId in this.callbackForPackId) {
          if (this.ws && this.callbackForPackId.hasOwnProperty(packId)) {
            this.ws.send(this.callbackForPackId[packId].str)

            clearTimeout(this.callbackForPackId[packId].ttl)
            this.callbackForPackId[packId].ttl = setTimeout(function () {
              this.callbackForPackId[packId].reject(new Error('TIMEOUT'))
              this.dropCallback(packId)
            }, 10000)
          }
        }

        this.onOpen()
      }

      this.ws.onerror = e => {
        console.error('[WebSocket ERROR] Connection Error: ', e)
        this.reconnect(wsServer, true)
      }

      this.ws.onclose = _ => {
        this.connected = false
        this.connecting = false

        clearInterval(this.ttltick)
        this.ttltick = null

        this.ws = null

        this.reconnect(wsServer)
      }

      this.ws.onmessage = ({ data: msg }) => {
        if (msg[0] === '{') {
          let data = JSON.parse(msg)
          if (data.type === 'INIT') {
            this.place = parseInt(data.place, 10)
            this.digits = parseInt(data.digits, 10)
            this.online = parseInt(data.top.online, 10)
            this.userTop = parseInt(data.top.userTop, 10)
            this.groupTop = parseInt(data.top.groupTop, 10)
            this.tick = parseInt(data.tick, 10)
          }

          if (data.pow) {
            try {
              let x = OmyEval(data.pow),
                str = 'C1 '.concat(data.randomId, ' ') + x

              if (this.connected) this.ws.send(str)
              else this.onConnectSend.push(str)
            } catch (e) { console.error(e) }
          }
        } else if (msg[0] === 'R') {
          let p = msg.replace('R', '').split(' '),
            d = p.shift()
          this.rejectAndDropCallback(d, new Error(p.join(' ')))
        } else if (msg[0] === 'C') {
          let h = msg.replace('C', '').split(' '),
            y = h.shift()

          this.resoveAndDropCallback(y, h.join(' '))
        } else if (msg === 'ALREADY_CONNECTED') {
          this.retryTime = 15000
          this.onAlredyConnectedCallback && this.onAlreadyConnectedCallback()
        } else if (msg.indexOf('SELF_DATA') === 0) {
          let data = msg.replace('SELF_DATA ', '').split(' ')
          let packId = parseInt(data[3], 10)
          this.resoveAndDropCallback(packId)
        } else if (msg === 'BROKEN') {
          this.retryTime = 25000
          this.onBrokenEventCallback && this.onBrokenEventCallback()
        } else if (msg.indexOf('TR') === 0) {
          let data = msg.replace('TR ', '').split(' ')
          let score = parseInt(data[0], 10),
            from = parseInt(data[1]),
            id = parseInt(data[2])

          this.onTransferCallback && this.onTransferCallback(from, score, id)
        }
      }
    } catch (e) {
      console.error('[WebSocket ERROR] ', e)
      this.reconnect(wsServer)
    }
  }

  close () {
    this.allowReconnect = false
    clearTimeout(this.ttl)
    clearInterval(this.ttltick)
    this.selfClose()
  }

  selfClose () {
    if (this.ws) {
      try { this.ws.close() }
      catch (e) { this.connected = false }
    }
  }

  reconnect (e, force = false) {
    if (this.allowReconnect || force) {
      clearTimeout(this.ttl)
      this.ttl = setTimeout(() => {
        this.run(e || this.wsServer)
      }, this.retryTime + Math.round(Math.random() * 5000))
      this.retryTime *= 1.3
    }
  }

  onOpen () {
    this.callback && this.callback()

    this.retryTime = 1000
  }

  onTransfer (callback) {
    this.onTransferCallback = callback
  }

  onOnline (e) {
    this.onOnlineCallback = e
  }

  onAlreadyConnected (e) {
    this.onAlredyConnectedCallback = e
  }

  onBrokenEvent (e) {
    this.onBrokenEventCallback = e
  }

  resoveAndDropCallback (e, t) {
    if (this.callbackForPackId[e]) {
      this.callbackForPackId[e].resolve(t)
      this.dropCallback(e)
    }
  }

  rejectAndDropCallback (e, t) {
    if (this.callbackForPackId[e]) {
      this.callbackForPackId[e].reject(t)
      this.dropCallback(e)
    }
  }

  dropCallback (e) {
    if (this.callbackForPackId[e]) {
      clearTimeout(this.callbackForPackId[e].ttl)
      delete this.callbackForPackId[e]
    }
  }
}

class API {
  /**
   * @param {Number} key - API-ключ
   * @param {String} userId - ID пользователя
   */
  constructor (key, userId) {
    this.key = key
    this.userId = userId
  }

  /**
   * @async
   * @param {Array<Number>} tx - Transaction Array. Documentation: vk.com/@hs-marchant-api
   * @returns {Promise<[{ id: Number, from_id: Number, to_id: Number, amount: String, type: Number, payload: Number, external_id: Number, created_at: Number }]>}
   * Array with transactions
   */
  async getTransactionList (tx = [1]) {
    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/tx/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          merchantId: this.userId,
          key: this.key,
          tx: tx,
        },
        json: true,
        method: 'POST',
      }
    )

    return result
  }

  /**
     * @async
     * @param {Number} toId - Transfer to
     * @param {Number} amount - Amount to transfer
     * @param {Boolean} markAsMerchant - Mark As Merchant (default: false)
     * @property {Object} response - Result
     * @property {Number} response.id - Transaction ID
     * @property {Number} response.amount - Coins amount
     * @property {Number} response.current - Current balance
     * @returns {Promise<{ response: { id: Number, amount: Number, current: Number } }>}
     * Object with keys id, amount, current
     */
  async sendPayment (toId, amount, markAsMerchant = false) {
    if (typeof toId !== 'number') {
      throw new Error('ID must be an integer')
    }

    if (typeof amount !== 'number') {
      throw new Error('Amount must be an integer')
    }

    if (typeof markAsMerchant !== 'boolean') {
      throw new Error('markAsMerchant must be an boolean')
    }

    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/send/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          merchantId: this.userId,
          key: this.key,
          toId: toId,
          amount: amount,
          markAsMerchant: markAsMerchant,
        },
        json: true,
        method: 'POST',
      }
    )

    return result
  }

  /**
     * @param {Number} amount - Default amount to receive
     * @param {Boolean} fixation - Is amount fixed?
     * @param {Boolean} hex - Is hexed? (default: false)
     * @returns {String} - URL
     */
  getLink (amount, fixation, hex = false) {
    if (typeof amount !== 'number') {
      throw new Error('Amount must be an integer')
    }

    const payload = random(-2000000000, 2000000000)

    return hex ? `vk.com/coin#m${dechex(this.userId)}_${dechex(amount)}_${dechex(payload)}${fixation ? '' : '_1'}` : `vk.com/coin#x${this.userId}_${amount}_${payload}${fixation ? '' : '_1'}`
  }

  /**
     * @async
     * @param {Array<Number>} userIds - Array with user IDs
     * @property {Object} response - Result
     * @returns {Promise<{ response: {} }>} - Array result with IDs
     */
  async getBalance (userIds) {
    if (!userIds) {
      throw new Error('User IDs not found')
    }

    if (!(userIds instanceof Array)) {
      throw new Error('`userIds` must be an array')
    }

    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/score/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          merchantId: this.userId,
          key: this.key,
          userIds: userIds,
        },
        json: true,
        method: 'POST',
      }
    )

    return result
  }

  /**
     * @async
     * @description - Get current balance
     * @returns {Number} - Current balance
     */
  async getMyBalance () {
    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/score/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          key: this.key,
          merchantId: this.userId,
          userIds: [this.userId],
        },
        json: true,
        method: 'POST',
      }
    )

    return result.response[this.userId]
  }

  /**
     * @param {String} name - New shop name
     * @description Change shop name
     * @returns {Promise<{ response: {} }>}
     */
  async setShopName (name) {
    if (!name) {
      throw new Error('New shop name is empty.')
    }

    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/set/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name,
          key: this.key,
          merchantId: this.userId,
        },
        json: true,
        method: 'POST',
      }
    )

    return result
  }

  /**
     * @param {Number} coins - Coins
     * @description
     * Formats coins amount (ex: 1234567890 -> 1 234 567,890)
     * @returns {String} - Formatted result
     */
  formatCoins (coins) {
    coins = Number(coins)

    return (coins / 1000).toLocaleString('ru-RU')
  }
}

module.exports = class VKCoin {
  /**
   * @param {Object} options - Class Options
   * @param {String} options.key - Merchant Key
   * @param {Number} options.userId - VK User ID
   * @param {String} options.token - VK Auth Token
   */
  constructor (options = {}) {
    if (!options.key) throw new Error('Incorrect Merchant ID')
    if (!options.userId) throw new Error('Incorrect User ID')
    if (!options.token) throw new Error('Incorrect VK Auth Token')

    this.key = options.key
    this.token = options.token
    this.userId = options.userId

    this.api = new API(this.key, this.userId)
    this.updates = new Updates(this.key, this.token, this.userId)
  }
}
