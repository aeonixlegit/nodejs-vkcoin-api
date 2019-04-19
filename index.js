const WebSocket = require('ws')

const KOA = require('koa')
const koaBody = require('koa-body')

const random = require('./functions/random')
const request = require('./functions/request')
const formatURL = require('./functions/formatURL')
const getURLbyToken = require('./functions/getURLbyToken')

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
  }

  /**
   * @async
   * @description Start VKAPI real-time pooling
   */
  async startPolling (callback) {
    const url = await getURLbyToken(this.token)
    const wsURL = formatURL(url, this.userId)

    this.ws = new WebSocket(wsURL)

    this.ws.onopen = (data) => {
      callback && callback(data)
    }

    this.ws.onerror = (data) => {
      console.error(`Something happened with VK Coin: ${data.message}`)
    }
  }

  /**
   * @param {Object} options - WebHook options
   * @param {String} options.url - WebHook Public IP / URL
   * @param {Number} options.port - WebHook Conenction Port (default: 8181)
   */
  async startWebHook (options = {}) {
    let { url, port } = options

    if (!url) {
      throw new Error('WebHook public URL isn\'t found')
    }

    if (!port) options.port = 8181

    this.app = new KOA()
    this.app.use(koaBody())
    this.app.listen(port)

    if (!/^(?:https?)/.test(url)) {
      url = `http://${url}`
    }

    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/set/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          callback: `${url}:${port}`,
          key: this.key,
          merchantId: this.userId,
        },
        json: true,
        method: 'POST',
      }
    )

    if (result.response === 'ON') {
      return true
    }
    else {
      throw new Error(`Can't start WebSocket Callback: ${result}`)
    }
  }

  /**
   * @param {Function} callback - Callback
   * @returns {{ amount: Number, fromId: Number, id: Number }}
   * Object with keys: amount - VK Coins amount, fromId - sender id и id - transaction ID
   */
  onTransfer (callback) {
    if (this.ws) {
      this.ws.onmessage = (data) => {
        const message = data.data
        if (!/^(?:TR)/i.test(message)) return

        let { amount, fromId, id } = message.match(/^(?:TR)\s(?<amount>.*)\s(?<fromId>.*)\s(?<id>.*)/i).groups

        amount = Number(amount)
        fromId = Number(fromId)
        id = Number(id)

        const event = { amount, fromId, id }

        return callback(event)
      }
    } else if (this.app) {
      this.app.use((ctx) => {
        ctx.status = 200

        callback(ctx.request.body)
      })
    }
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

    this.updates = new Updates(this.key, this.token, this.userId)
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
          tx,
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
     * @async
     * @param {Number} toId - Transfer to
     * @param {Number} amount - Amount to transfer
     * @property {Object} response - Result
     * @property {Number} response.id - Transaction ID
     * @property {Number} response.amount - Coins amount
     * @property {Number} response.current - Current balance
     * @returns {Promise<{ response: { id: Number, amount: Number, current: Number } }>}
     * Object with keys id, amount, current
     */
  async sendPayment (toId, amount) {
    if (typeof toId !== 'number') {
      throw new Error('ID must be an integer')
    }

    if (typeof amount !== 'number') {
      throw new Error('Amount must be an integer')
    }

    const result = await request(
      'https://coin-without-bugs.vkforms.ru/merchant/send/',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          toId,
          amount,
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
     * @param {Number} amount - Default amount to receive
     * @param {Boolean} fixation - Is amount fixed?
     * @returns {String} - URL
     */
  getLink (amount, fixation) {
    if (typeof amount !== 'number') {
      throw new Error('Amount must be an integer')
    }

    const payload = random(-2000000000, 2000000000)
    return `vk.com/coin#x${this.userId}_${amount}_${payload}${fixation ? '' : '_1'}`
  }

  /**
     * @async
     * @param {Array<Number>} userIds - Array with user IDs
     * @property {Object} response - Result
     * @returns {Promise<{ response: {} }>}
     * Array result with IDs
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
          key: this.key,
          merchantId: this.userId,
          userIds,
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
      throw new Error('New shop name is empty')
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

    return (coins / 1000)
      .toLocaleString()
      .replace(/,/g, ' ')
      .replace(/\./g, ',')
  }
}
