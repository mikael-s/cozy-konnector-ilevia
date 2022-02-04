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

const moment = require('moment')

const VENDOR = 'Ilévia'
const baseUrl = 'https://www.ilevia.fr/'

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authenticating ...')
  //if (cozyParameters) log('debug', 'Found COZY_PARAMETERS')
  await authenticate.bind(this)(fields.login, fields.password)
  log('info', 'Successfully logged in')
  log('info', 'Fetching the list of documents')
  const $ = await request(`${baseUrl}/fr/historique-commandes`)
  const bills = fetchInvoices($)
  log('info', bills.length + ' bill(s) found')
  //log('debug', bills)
  if (bills.length > 0) {
    await this.saveBills(bills, fields, {
      idenditifiers: ['Ilévia'], // name of the target website
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
      id: {
        sel: '.history_invoice .cart-product__cell a',
        attr: 'href',
        parse: parseId
      },
      title: {
        sel: '.history_link .cart-product__cell a'
      },
      date: {
        sel: '.history_date .cart-product__cell',
        parse: date => new Date(date.split('/').reverse().join('/'))
      },
      amount: {
        sel: '.history_price .cart-product__cell span',
        parse: amount => parseFloat(amount.replace('€', '').trim().replace(',', '.'))
      },
      fileurl: {
        sel: '.history_invoice .cart-product__cell a',
        attr: 'href'
      },
      filename: {
        sel: '.history_link .cart-product__cell a'
      },
      vendor: {
        parse: vendor => VENDOR
      },
      currency: {
        parse: currency => '€'
      }
    },
    '.cart-product__item tr'
  )
  const res = invoices.filter(invoice => invoice['fileurl'] != null)
  return res.map(invoice => ({
    ...invoice,
    filename: moment(invoice['date']).format('DD-MM-YYYY') + '_' + invoice['title'] + ".pdf"
  }));
}

function parseId(id) {
  if(id) {
    const res = id.split('=')
    return res[res.length - 1]
  }
  return null
}