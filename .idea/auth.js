const os = require('os') 
const tokenURL = 'http://app.ideablock.kek/cli/update-token'
const fetch = require('node-fetch') 
const FormData = require('form-data')
const fs = require('fs') 

class Auth {
    constructor(email, password) {
        const formData = new FormData()
        formData.append('email', email) 
        formData.append('password', password) 

        const options = {
            method: 'post', 
            body: formData
        }
        fetch(tokenURL, options).then(
            res => res.json() 
        ).then(
            json => this.saveToken(json) 
        )
    } 

    saveToken(token) {
        const fileLoc = os.homedir()+'/.ideablock/auth.json' 
        fs.open(fileLoc, err => {
            const jsonWriteData = {"auth":token}
            fs.mkdir(os.homedir()+"/.ideablock", err => {
            })  
            fs.writeFile(fileLoc, JSON.stringify(jsonWriteData), err => {
                if (err == null) {
                    console.log("Token updated successfully") 
                } else {
                    console.log(err)
                }
            })
        }) 
    }
}

module.exports = Auth