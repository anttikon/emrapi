const express = require('express')
const index = express()
const port = 5555
const leven = require('leven')
const cards = require('./data.json')

const getDistance = (card, query) => {
  if (card.names) {
    return card.names
      .map(name => leven(name.toLowerCase(), query.c.toLowerCase()))
      .sort()[0]
  } else {
    return leven(card.name.toLowerCase(), query.c.toLowerCase())
  }
}

const searchCard = (cards, query) => {
  return cards.reduce(
    (acc, card) => {
      const distance = getDistance(card, query)
      if (distance < acc.distance) {
        return { distance, cards: [card] }
      } else if (distance === acc.distance) {
        return { distance, cards: [...acc.cards, card] }
      }
      return acc
    },
    { distance: Infinity, cards: [] }
  )
}

index.get('/cards', (req, res) => {
  const { c } = req.query
  if (!c || !c.length) {
    res.status(400).send('Query is missing')
  }
  res.json(searchCard(cards, { c }).cards)
})

index.listen(port, () => console.log(`Emrapi listening on port ${port}!`))

module.exports = {
  app: index
}
