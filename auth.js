const os = require('os')
const path = require('path')
const tokenURL = 'https://beta.ideablock.io/cli/update-token'
const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs-extra')
const authFilePath = path.join(os.homedir(), '.ideablock', 'auth.json')

class Auth {
  constructor (email, password) {
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    const options = {
      method: 'post',
      body: formData
    }
    fetch(tokenURL, options)
      .then(res => res.json())
      .then(json => writeAuthFile(json))
  }
}

function writeAuthFile (data) {
  fs.ensureFile(authFilePath)
    .then(() => {
      fs.writeFileSync(authFilePath, data)
    })
    .catch(err => {
      console.error(err)
    })
}

module.exports = Auth
