const API = require('./api')
const Updates = require('./updates')
const Utils = require('./utils')

module.exports = class VKCoin {
  /**
   * @param {Object} options - Class Options
   * @param {String} options.key - Merchant Key
   * @param {Number} options.userId - VK User ID
   * @param {String} options.token - VK Auth Token
   */
  constructor ({ key, userId, token }) {
    if (!key) throw new Error('Incorrect Merchant ID')
    if (!userId) throw new Error('Incorrect User ID')
    if (!token) throw new Error('Incorrect VK Auth Token')

    this.key = key
    this.token = token
    this.userId = userId

    this.api = new API(this.key, this.userId)
    this.updates = new Updates(this.key, this.token, this.userId)
    this.utils = new Utils(this.userId)
  }
}
