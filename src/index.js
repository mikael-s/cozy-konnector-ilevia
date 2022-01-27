const fs = require('fs')

const {
  BaseKonnector,
  requestFactory,
  scrape,
  log,
  utils
} = require('cozy-konnector-libs')
const request = requestFactory({
  cheerio: true,
  json: false,
  jar: true,
  debug: false
})

const VENDOR = 'template'
const baseUrl = 'https://www.ilevia.fr/'

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authenticating ...')
  //if (cozyParameters) log('debug', 'Found COZY_PARAMETERS')
  await authenticate.bind(this)(fields.login, fields.password)
  log('info', 'Successfully logged in')
  // The BaseKonnector instance expects a Promise as return of the function
  log('info', 'Fetching the list of documents')
  const $ = await request(`${baseUrl}/fr/historique-commandes`)
}

function authenticate(username, password) {
  return this.signin({
    url: `https://www.ilevia.fr/fr/connexion`,
    formSelector: 'form#login_form',
    formData: {
      email: username,
      passwd: password,
      SubmitLogin: true,
      ajax: true,
      login_compte_in_tunnel: 0,
      choix_mon_compte: "oui"
    },
    validate: (statusCode, $, fullResponse) => {
      return statusCode === 200 || log('error', 'Invalid credentials')
    }
  })
}

function writeFile(name, content) {
  fs.writeFile('./tmp/'+name, content, err => {
    if (err) {
      console.error(err)
      return
    }
  })
}