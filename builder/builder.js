const fs = require('fs')
const http = require('https')
const dataDir = `${__dirname}/../data`

const mkdir = path =>
  fs.promises.stat(path).catch(() => fs.promises.mkdir(path))

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    http
      .get(url, response => {
        response.pipe(file)
        file.on('finish', () => resolve(dest))
      })
      .on('error', err => fs.unlink(dest, () => reject(err)))
  })

const getNames = card_faces =>
  card_faces ? card_faces.map(card_face => card_face.name) : undefined

const minifyData = data => {
  const minifiedData = data.reduce((acc, card) => {
    const { id, name, multiverse_ids, layout, set, card_faces } = card
    const print = {
      id,
      multiverse_ids,
      layout,
      set
    }
    if (!acc[name]) {
      acc[name] = { name, names: getNames(card_faces), prints: [print] }
      return acc
    } else {
      acc[name].prints.push(print)
      return acc
    }
  }, {})
  return Object.values(minifiedData)
}

const dataPath = `${__dirname}/../data.json`

const shouldDownloadData = () => {
  if (process.env.OVERRIDE_DATA) {
    return true
  }
  return fs.promises
    .stat(dataPath)
    .then(() => false)
    .catch(() => true)
}

const main = async () => {
  if (!(await shouldDownloadData())) {
    console.log('No need to download and process data')
    return dataPath
  }
  console.log('Downloading and processing data')

  await mkdir(dataDir)
  await download(
    'https://archive.scryfall.com/json/scryfall-default-cards.json',
    `${dataDir}/scryfall-default-cards.json`
  )
  const scryfallData = require(`${dataDir}/scryfall-default-cards.json`)

  const filteredScryfallData = scryfallData.filter(
    r =>
      r.multiverse_ids.length > 0 &&
      !r.type_line.startsWith('Basic Land') &&
      !r.type_line.startsWith('Basic Snow Land') &&
      r.layout !== 'token'
  )
  fs.writeFileSync(dataPath, JSON.stringify(minifyData(filteredScryfallData)))
  return dataPath
}

main()
  .then(path => console.log('Processing done', path))
  .catch(e => {
    console.error(e.stack)
    process.exit(1)
  })
