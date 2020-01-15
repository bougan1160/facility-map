import Papa from 'papaparse'

const csvLoader = (fileName) => {
  return new Promise((resolve, reject) => {
    Papa.parse(`./data/${fileName}`, {
      download: true,
      complete: (results, file) => {
        resolve(results.data)
      },
      error: (err) => {
        reject(err)
      }
    })
  })
}

export default ({ app }, inject) => {
  inject('csvLoader', csvLoader)
}
