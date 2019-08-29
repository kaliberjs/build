module.exports = function checkInternationalization() {
  const numberToCheck = (0.1).toLocaleString('nl-NL') !== '0,1'
  const dateToCheck = new Date('August 19, 1975 23:15:30').toLocaleString('nl-NL') !== '19-8-1975 23:15:30'

  if (numberToCheck || dateToCheck) {
    throw new Error('ICU not supported correctly please check if full-icu packge is present in the node_modules')
  }
}
