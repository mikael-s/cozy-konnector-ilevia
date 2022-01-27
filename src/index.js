const {
  BaseKonnector,
  requestFactory,
  scrape,
  log,
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
  log('info', 'Fetching the list of documents')
  const $ = await request(`${baseUrl}/fr/historique-commandes`)
  const invoices = fetchInvoices($)
  log('info', invoices.length + ' invoice(s) found')
  if (invoices.length > 0) {
    await this.saveFiles(invoices, fields, {
      idenditifiers: ['vendor'], // name of the target website
      contentType: 'application/pdf'
    })
  }
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

function fetchInvoices($) {
  const invoices = scrape(
    $,
    {
      title: {
        sel: '.history_link .cart-product__cell a'
      },
      date: {
        sel: '.history_date .cart-product__cell'
      },
      fileurl: {
        sel: '.history_invoice .cart-product__cell a',
        attr: 'href'
      },
      filename: {
        sel: '.history_link .cart-product__cell a',
        parse: title => `${title}.pdf`
      }
    },
    '.cart-product__item tr'
  )
  const res = invoices
    .filter(invoice => invoice['fileurl'] != null)
  return res;
}