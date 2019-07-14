const os = require('os')
const path = require('path')
const tokenURL = 'https://beta.ideablock.io/cli/update-token'
const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')

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
      .then(json => this.saveToken(json))
  }

  saveToken (token) {
    console.log("THIS IS TOKEN: " + token)
    fs.mkdir(path.join(os.homedir(), '/.ideablock'), { mode: 0o600 }, (err) => {
      if (err) console.log(err)
      const fileLoc = path.join(os.homedir(), '/.ideablock', 'auth.json')
      const jsonWriteData = { token }
      fs.writeFile(fileLoc, JSON.stringify(jsonWriteData), { mode: 0o600 }, err => {
        if (err) console.log(err)
        console.log('Token updated successfully to: ' + JSON.stringify(jsonWriteData))
      })
    })
  }
}

module.exports = Auth
