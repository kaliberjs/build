const numberToCheck = (0.1).toLocaleString('nl-NL') !== '0,1'
const dateToCheck = new Date('August 19, 1975 23:15:30').toLocaleString('nl-NL') !== '19-8-1975 23:15:30'
const monthCheck = new Intl.DateTimeFormat('nl', { month: 'long' }).format(new Date(9e8)) !== 'januari'

if (numberToCheck || dateToCheck || monthCheck) {
  throw new Error('ICU not supported correctly please check if full-icu packge is present in the node_modules')
}
