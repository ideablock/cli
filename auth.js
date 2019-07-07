const os = require('os')
const path = require('path')
const shell = require('shelljs')
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
    shell.mkdir(path.join(os.homedir(), '/.ideablock'))
    const fileLoc = path.join(os.homedir(), '/.ideablock', 'auth.json')
    fs.open(fileLoc, err => {
      if (err) console.log(err)
      const jsonWriteData = { token }
      fs.mkdir(os.homedir() + '/.ideablock', err => {
        if (err) console.log(err)
      })
      fs.writeFile(fileLoc, JSON.stringify(jsonWriteData), err => {
        if (err == null) {
          console.log('Token updated successfully')
        } else {
          console.log(err)
        }
      })
    })
  }
}

module.exports = Auth