const toGeoJSON = (header, values, { latCol, lonCol }) => {
  values = Array.isArray(values) ? values : [values]
  const latIdx = header.indexOf(latCol)
  const lonIdx = header.indexOf(lonCol)
  return {
    type: 'FeatureCollection',
    features: values.filter(d => !isNaN(Number(d[latIdx])) && !isNaN(Number(d[lonIdx])))
      .map((d) => {
        const properties = { header, values: d }
        const geometry = {
          type: 'Point',
          coordinates: [Number(d[lonIdx]), Number(d[latIdx])]
        }
        return { type: 'Feature', geometry, properties }
      })
  }
}

export default ({ app }, inject) => {
  inject('toGeoJSON', toGeoJSON)
}
