module.exports = {
  firstLetterLowerCase
}

function firstLetterLowerCase(word) {
  const firstLetter = word.slice(0, 1)
  return firstLetter.toLowerCase() === firstLetter
}
