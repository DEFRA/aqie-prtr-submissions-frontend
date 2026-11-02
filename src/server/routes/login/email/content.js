const ENTER_EMAIL = 'Enter your email address'

export const content = {
  'en-GB': {
    default: {
      title: ENTER_EMAIL,
      heading: 'Pollution Release and Transfer data reporting',
      intro: 'Some context on the service…',
      label: ENTER_EMAIL,
      hint: 'This should be the email address that you received the link to this site on and that you can access',
      notRecognisedSummary: 'My email address is not recognised',
      notRecognisedText: 'Help content to be confirmed.',
      button: 'Continue'
    },
    // Only what differs from `default`
    modules: {
      'address-book': {
        intro: 'Sign in to the PRTR address book.'
      },
      'pollutant-data-collection': {
        intro: 'Sign in to report pollutant and waste data for your facilities.'
      },
      nrdu: {
        intro:
          'Sign in to upload pollutant release data as a national regulator.'
      }
    },
    errors: {
      required: ENTER_EMAIL,
      invalid:
        'Enter an email address in the correct format, like name@example.com',
      sendFailed: 'We could not send a passcode. Try again.',
      tooManyRequests: 'Wait a minute before requesting another passcode'
    }
  },
  cy: {
    default: {
      title: 'Rhowch eich cyfeiriad e-bost',
      heading: 'Adrodd data Rhyddhau a Throsglwyddo Llygryddion',
      intro: 'Rhywfaint o gyd-destun am y gwasanaeth…',
      label: 'Rhowch eich cyfeiriad e-bost',
      hint: 'Dylai hwn fod y cyfeiriad e-bost y cawsoch y ddolen i’r wefan hon arno ac y gallwch gael mynediad ato',
      notRecognisedSummary: 'Nid yw fy nghyfeiriad e-bost yn cael ei adnabod',
      notRecognisedText: 'Bydd cynnwys cymorth yn cael ei gadarnhau.',
      button: 'Parhau'
    },
    modules: {
      'pollutant-data-collection': {
        intro:
          'Mewngofnodwch i adrodd data llygryddion a gwastraff ar gyfer eich cyfleusterau.'
      }
    },
    errors: {
      required: 'Rhowch eich cyfeiriad e-bost',
      invalid:
        'Rhowch gyfeiriad e-bost yn y fformat cywir, fel enw@enghraifft.com',
      sendFailed: 'Nid oeddem yn gallu anfon cod. Rhowch gynnig arall arni.',
      tooManyRequests: 'Arhoswch funud cyn gofyn am god arall'
    }
  }
}
