const request = require('./request')

module.exports = async (token) => {
  let result = await request(`https://api.vk.com/method/apps.get?access_token=${token}&app_id=6915965&v=5.95`)

  if (result && !result.error) {
    result = JSON.parse(result)
    const { mobile_iframe_url } = result.response.items[0]
    return mobile_iframe_url
  } else {
    throw new Error('Не удалось получить ссылку на приложение. Попробуйте переполучить токен.')
  }
}
