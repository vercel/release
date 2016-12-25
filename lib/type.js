module.exports = (text, changeTypes) => {
  for (const type of changeTypes) {
    const handle = '(' + type.handle + ')'

    if (text.includes(handle)) {
      return type.handle
    }
  }

  return false
}
