export const content = {
  'en-GB': {
    default: {
      title: 'Check your email for a code',
      intro:
        'A unique code has been sent to your email address. Do not share this code with anyone else.',
      delay: 'The code email can take a few minutes to arrive.',
      noCodeIntro: 'If you do not receive the code email after 10 minutes:',
      noCodeStep1: 'check that the email is not in your spam or junk folder',
      noCodeStep2: 'check you are connected to the internet',
      label: 'Enter code',
      notArrivedSummary: "My code hasn't arrived or isn't working",
      notArrivedText: 'Help content to be confirmed.',
      changeEmail: 'Use a different email address',
      button: 'Continue'
    },
    // Only what differs from `default`
    modules: {},
    errors: {
      required: 'Enter the 6-digit passcode',
      invalid: 'The passcode must be 6 digits',
      incorrect: 'The passcode is not correct or has expired',
      tooManyAttempts:
        'You have entered too many incorrect passcodes. Request a new one',
      verifyFailed: 'We could not check your passcode. Try again.'
    }
  },
  cy: {
    default: {
      title: 'Gwiriwch eich e-bost am god',
      intro:
        'Mae cod unigryw wedi cael ei anfon i’ch cyfeiriad e-bost. Peidiwch â rhannu’r cod hwn ag unrhyw un arall.',
      delay: 'Gall yr e-bost cod gymryd ychydig funudau i gyrraedd.',
      noCodeIntro: 'Os na fyddwch yn cael yr e-bost cod ar ôl 10 munud:',
      noCodeStep1: 'gwiriwch nad yw’r e-bost yn eich ffolder sbam neu sothach',
      noCodeStep2: 'gwiriwch eich bod wedi cysylltu â’r rhyngrwyd',
      label: 'Rhowch y cod',
      notArrivedSummary: 'Nid yw fy nghod wedi cyrraedd neu nid yw’n gweithio',
      notArrivedText: 'Bydd cynnwys cymorth yn cael ei gadarnhau.',
      changeEmail: 'Defnyddio cyfeiriad e-bost gwahanol',
      button: 'Parhau'
    },
    modules: {},
    errors: {
      required: 'Rhowch y cod 6 digid',
      invalid: 'Rhaid i’r cod fod yn 6 digid',
      incorrect: 'Nid yw’r cod yn gywir neu mae wedi dod i ben',
      tooManyAttempts:
        'Rydych wedi rhoi gormod o godau anghywir. Gofynnwch am un newydd',
      verifyFailed:
        'Nid oeddem yn gallu gwirio’ch cod. Rhowch gynnig arall arni.'
    }
  }
}
