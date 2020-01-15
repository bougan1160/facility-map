<template>
  <v-layout
    column
    style="position: relative;"
  >
    <div id="map-wrap" style="height: 90%;">
      <client-only>
        <l-map ref="map" :zoom="zoom" :center="center">
          <l-tile-layer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" :attribution="attribution" />
        </l-map>
      </client-only>
    </div>
    <div id="legends">
      <div id="population" class="d-flex pa-3">
        <p class="font-weight-bold mr-2 mb-0">
          {{ `人口(${legends.population.label})` }}
        </p>
        <div v-for="(legend, idx) in legends.population.values" :key="idx" class="legend mr-3">
          <span :style="{'background-color': legend.color}" style="width: 50px;opacity: 0.5;" />
          <span>{{ `~${legend.val}${legends.population.unit}` }}</span>
        </div>
      </div>
      <div id="facility" class="d-flex pa-3">
        <p class="font-weight-bold mr-2 mb-0">
          {{ `施設(${legends.facility.label})` }}
        </p>
        <div v-for="(legend, idx) in legends.facility.values" :key="idx" class="legend mr-3">
          <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png" height="25px" :class="`leaflet-marker-icon-color-${legend.color}`">
          <span>{{ `${legend.label ? legend.label: legend.val}` }}</span>
        </div>
      </div>
    </div>
    <v-card v-if="information" id="information" class="pa-3">
      <div class="close" @click="information=false">
        <v-icon>mdi-close</v-icon>
      </div>
      <v-card-title>{{ information.values[information.header.indexOf('名称')] }}</v-card-title>
      <v-container style="height: calc(100% - 60px); overflow-y: auto">
        <v-row
          v-for="(key, idx) in information.header"
          :key="idx"
          :class="idx % 2 === 0 ? 'row-invert': ''"
          justify="center"
        >
          <v-col
            class="key-label">{{ key }}
          </v-col>
          <v-col style="word-break: break-all">{{ information.values[idx] }}</v-col>
        </v-row>
      </v-container>
    </v-card>
    <v-card id="setting">
      <v-expansion-panels accordion>
        <v-expansion-panel>
          <v-expansion-panel-header>人口</v-expansion-panel-header>
          <v-expansion-panel-content style="max-height: 350px;">
            <v-list height="100%" style="overflow-y: auto">
              <v-divider></v-divider>
              <v-subheader>種別</v-subheader>
              <v-list-item-content>
                <v-radio-group
                        v-model="population.type"
                        hide-details
                        dense
                >
                  <v-radio label="人口" value="population"/>
                  <v-radio label="世帯数" value="house"/>
                </v-radio-group>
              </v-list-item-content>
              <v-divider/>
              <v-subheader>対象</v-subheader>
              <v-list-item-content>
                <v-radio-group
                        v-model="population.target"
                        hide-details
                        dense
                        :disabled="population.type === 'house'"
                >
                  <v-radio label="すべて" value="all"/>
                  <v-radio label="男性" value="man"/>
                  <v-radio label="女性" value="woman"/>
                </v-radio-group>
              </v-list-item-content>
              <v-divider/>
              <v-subheader>年代</v-subheader>
              <v-list-item-content>
                <v-radio-group
                        v-model="population.generation"
                        hide-details
                        dense
                        :disabled="population.type === 'house'"
                >
                  <v-radio label="すべて" value="all"/>
                  <v-radio
                          v-for="(val, idx) in 17"
                          :key="val"
                          :label="`${idx * 5}-${(idx * 5)+4}歳`"
                          :value="idx"
                  />
                  <v-radio label="85歳以上" value="18"/>
                </v-radio-group>
              </v-list-item-content>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>施設</v-expansion-panel-header>
          <v-expansion-panel-content height="100%" style="overflow-y: auto" class="pa-3">
            <v-radio-group
              v-model="facilityType"
              hide-details
              dense
            >
              <v-radio label="すべて" value="all"/>
              <v-radio label="教育/文化系施設" value="school"/>
              <v-radio label="医療/福祉系施設" value="hospital"/>
              <v-radio label="行政/産業系施設" value="gov"/>
              <v-radio label="設置年" value="year"/>
              <v-radio label="防災拠点指定" value="evacuation"/>
              <v-radio label="収支" value="cost"/>
              <v-radio label="利用者数" value="user"/>
            </v-radio-group>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>
  </v-layout>
</template>

<script>
/* globals L */
export default {
  data () {
    return {
      center: [34.76638, 134.79688],
      zoom: 14,
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      populationTarget: '',
      information: false,
      population: {
        type: 'population',
        target: 'all',
        generation: 'all'
      },
      facilityType: 'all',
      legends: {
        population: {
          values: [],
          unit: '',
          label: ''
        },
        facility: {
          values: [],
          unit: '',
          label: ''
        }
      }
    }
  },

  watch: {
    population: {
      handler: 'changePopulationTarget',
      deep: true
    },
    facilityType: 'changeFacilityType'
  },

  mounted () {
    setTimeout(() => {
      this.layers = {}
      this.initLayers(this.$refs.map.mapObject)
    }, 100)
  },

  methods: {
    initLayers (map) {
      this.$csvLoader('282162_sisetubetukarute_20171.csv')
        .then((data) => {
          const header = data.shift()
          const titleIdx = header.indexOf('名称')
          const geojson = this.$toGeoJSON(header, data, { latCol: '緯度', lonCol: '経度' })
          this.layers.facility = L.geoJSON(geojson)
            .bindPopup(layer => layer.feature.properties.values[titleIdx])
            .on('click', (e) => {
              if (e.layer && e.layer.feature && e.layer.feature.properties) {
                this.information = e.layer.feature.properties
              }
            })
            .addTo(map)
          this.changeFacilityType()
        })
        .catch(console.error)
      Promise.all([
        this.$csvLoader('282162_population_20191129.csv'),
        this.$axios.get('./data/takasago.json').then(res => res.data)
      ])
        .then(([population, areas]) => {
          const header = population.shift()
          const areaNameIdx = header.indexOf('地域名')
          areas.features.forEach((feature) => {
            const data = population.find(p => p[areaNameIdx] === feature.properties.layer)
            if (data) {
              feature.properties = Object.assign(feature.properties, { header, values: data })
            }
          })
          this.layers.population = L.geoJSON(areas, { style: this.populationStyling() }).addTo(map)
          this.changePopulationTarget('総人口')
        })
        .catch(console.error)
    },
    populationStyling () {
      const style = {
        cols: [],
        colors: [],
        unitLabel: '',
        legendLabel: ''
      }
      if (this.population.type === 'house') {
        style.cols = ['世帯数']
        style.colors = [
          { val: 3000, color: '#ff3b00' },
          { val: 4500, color: '#ffe086' },
          { val: 6000, color: '#5eff65' },
          { val: 7500, color: '#46ffe2' },
          { val: 9000, color: '#0faeff' },
          { val: 10500, color: '#0227ff' }
        ]
        style.unitLabel = '世帯'
        style.legendLabel = '世帯数'
      } else if (this.population.target === 'all' && this.population.generation === 'all') {
        style.cols = ['総人口']
        style.colors = [
          { val: 5000, color: '#ff3b00' },
          { val: 8000, color: '#ffe086' },
          { val: 11000, color: '#5eff65' },
          { val: 14000, color: '#46ffe2' },
          { val: 17000, color: '#0faeff' },
          { val: 20000, color: '#0227ff' }
        ]
        style.unitLabel = '人'
        style.legendLabel = '総人口'
      } else if (this.population.target !== 'all' && this.population.generation === 'all') {
        style.cols = [this.population.target === 'man' ? '男性' : '女性']
        style.colors = [
          { val: 3000, color: '#ff3b00' },
          { val: 4500, color: '#ffe086' },
          { val: 6000, color: '#5eff65' },
          { val: 7500, color: '#46ffe2' },
          { val: 9000, color: '#0faeff' },
          { val: 10500, color: '#0227ff' }
        ]
        style.unitLabel = '人'
        style.legendLabel = `${style.cols[0]}のみ`
      } else if (this.population.target === 'all' && this.population.generation !== 'all') {
        const generation = this.population.generation === '18' ? '85歳以上' : `${this.population.generation * 5}-${this.population.generation * 5 + 4}歳`
        style.cols = [`${generation}の男性`, `${generation}の女性`]
        style.colors = [
          { val: 100, color: '#ff3b00' },
          { val: 400, color: '#ffe086' },
          { val: 700, color: '#5eff65' },
          { val: 1000, color: '#46ffe2' },
          { val: 1300, color: '#0faeff' },
          { val: 1600, color: '#0227ff' }
        ]
        style.unitLabel = '人'
        style.legendLabel = `${generation}のみ`
      } else if (this.population.target !== 'all' && this.population.generation !== 'all') {
        const target = this.population.target === 'man' ? '男性' : '女性'
        const generation = this.population.generation === '18' ? '85歳以上' : `${this.population.generation * 5}-${this.population.generation * 5 + 4}歳`
        style.cols = [`${generation}の${target}`]
        style.colors = [
          { val: 100, color: '#ff3b00' },
          { val: 300, color: '#ffe086' },
          { val: 500, color: '#5eff65' },
          { val: 700, color: '#46ffe2' },
          { val: 900, color: '#0faeff' },
          { val: 1100, color: '#0227ff' }
        ]
        style.unitLabel = '人'
        style.legendLabel = `${style.cols[0]}のみ`
      }
      this.legends.population = {
        values: style.colors,
        unit: style.unitLabel,
        label: style.legendLabel
      }
      return (feature) => {
        const header = feature.properties.header
        const values = feature.properties.values
        let value = 0
        style.cols.forEach((col) => {
          const idx = header.indexOf(col)
          value += Number(values[idx])
        })
        const color = style.colors.find(c => value <= c.val)
        return { fillColor: color ? color.color : '*', opacity: 0.5 }
      }
    },
    changePopulationTarget () {
      this.layers.population.setStyle(this.populationStyling())
    },
    changeFacilityType () {
      const markerColors = ['blue', 'green', 'alua', 'yellow', 'pink', 'red']
      let colors = []
      if (this.facilityType === 'all') {
        this.legends.facility.label = 'すべて'
        colors = [{ label: '公共施設', color: '' }]
      } else if (this.facilityType === 'school') {
        colors = [
          { val: '市民文化系施設', color: markerColors[0] },
          { val: '社会教育系施設', color: markerColors[1] },
          { val: 'スポーツ施設', color: markerColors[2] },
          { val: '学校教育系施設', color: markerColors[3] },
          { val: '就学前教育保育施設', color: markerColors[4] },
          { val: '公園施設', color: markerColors[5] }
        ]
        this.legends.facility.label = '教育/文化系施設'
      } else if (this.facilityType === 'hospital') {
        colors = [
          { val: '保健・福祉施設', color: markerColors[0] },
          { val: '医療施設', color: markerColors[1] },
          { val: 'スポーツ施設', color: markerColors[2] },
          { val: '学校教育系施設', color: markerColors[3] },
          { val: '就学前教育保育施設', color: markerColors[4] },
          { val: '公園施設', color: markerColors[5] }
        ]
        this.legends.facility.label = '医療/福祉系施設'
      } else if (this.facilityType === 'gov') {
        colors = [
          { val: '行政系施設', color: markerColors[0] },
          { val: '産業系施設', color: markerColors[1] },
          { val: '処理施設', color: markerColors[2] },
          { val: '上水道施設', color: markerColors[3] },
          { val: '下水道施設', color: markerColors[4] }
        ]
        this.legends.facility.label = '行政/産業系施設'
      } else if (this.facilityType === 'year') {
        colors = [
          { val: 1, color: markerColors[0], label: '1年以内' },
          { val: 10, color: markerColors[1], label: '10年以内' },
          { val: 20, color: markerColors[2], label: '20年以内' },
          { val: 50, color: markerColors[3], label: '50年以内' },
          { val: 100, color: markerColors[4], label: '100年以内' },
          { color: markerColors[5], label: '100年以上前' }
        ]
        this.legends.facility.label = '設置年'
      } else if (this.facilityType === 'evacuation') {
        colors = [
          { val: '指定避難施設', color: markerColors[0] },
          { val: '避難所指定', color: markerColors[2] }
        ]
        this.legends.facility.label = '防災拠点指定'
      } else if (this.facilityType === 'cost') {
        colors = [
          { color: 'red', label: '赤字' },
          { color: 'blue', label: '黒字' }
        ]
        this.legends.facility.label = '収支'
      } else if (this.facilityType === 'user') {
        colors = [
          { val: 1000, color: markerColors[5], label: '〜1,000人' },
          { val: 5000, color: markerColors[4], label: '〜5,000人' },
          { val: 10000, color: markerColors[3], label: '〜10,000人' },
          { val: 50000, color: markerColors[2], label: '〜50,000人' },
          { val: 100000, color: markerColors[1], label: '〜100,000人' },
          { color: markerColors[0], label: '100,000人以上' }
        ]
        this.legends.facility.label = '利用者'
      }
      this.legends.facility.values = colors
      this.layers.facility.eachLayer((layer) => {
        const feature = layer.feature
        layer._icon.className = layer._icon.className.replace(/leaflet-marker-icon-color-[a-z]+/g, '')
        layer.closePopup()
        layer.setOpacity(1)
        if (['school', 'hospital', 'gov', 'evacuation'].includes(this.facilityType)) {
          const typeIdx = feature.properties.header.indexOf(this.facilityType === 'evacuation' ? '防災拠点指定' : '大分類')
          const value = feature.properties.values[typeIdx]
          const color = colors.find(c => c.val === value)
          const markerColor = color ? color.color : 'invisible'
          L.DomUtil.addClass(layer._icon, `leaflet-marker-icon-color-${markerColor}`)
          if (!color) {
            layer.setOpacity(0)
          }
        } else if (this.facilityType === 'year') {
          const typeIdx = feature.properties.header.indexOf('設置年月日_年(西暦)')
          const value = Number(feature.properties.values[typeIdx])
          let color
          const thisYear = new Date().getFullYear()
          if (thisYear - value <= 1) {
            color = markerColors[0]
          } else if (thisYear - value <= 10) {
            color = markerColors[1]
          } else if (thisYear - value <= 20) {
            color = markerColors[2]
          } else if (thisYear - value <= 50) {
            color = markerColors[3]
          } else if (thisYear - value <= 100) {
            color = markerColors[4]
          } else if (thisYear - value > 100) {
            color = markerColors[5]
          } else {
            color = 'invisible'
            layer.setOpacity(0)
          }
          L.DomUtil.addClass(layer._icon, `leaflet-marker-icon-color-${color}`)
        } else if (this.facilityType === 'cost') {
          const typeIdx = feature.properties.header.indexOf('収支(円)')
          const value = Number(feature.properties.values[typeIdx])
          let color
          if (value > 0) {
            color = 'blue'
          } else if (value < 0) {
            color = 'red'
          } else {
            color = 'invisible'
            layer.setOpacity(0)
          }
          L.DomUtil.addClass(layer._icon, `leaflet-marker-icon-color-${color}`)
        } else if (this.facilityType === 'user') {
          const typeIdx = feature.properties.header.indexOf('利用者数(人)')
          const value = Number(feature.properties.values[typeIdx])
          let color
          if (value <= 1000) {
            color = markerColors[5]
          } else if (value <= 5000) {
            color = markerColors[4]
          } else if (value <= 10000) {
            color = markerColors[3]
          } else if (value <= 50000) {
            color = markerColors[2]
          } else if (value <= 100000) {
            color = markerColors[1]
          } else if (value > 100000) {
            color = markerColors[0]
          } else {
            color = 'invisible'
            layer.setOpacity(0)
          }
          L.DomUtil.addClass(layer._icon, `leaflet-marker-icon-color-${color}`)
        }
      })
    }
  }
}
</script>

<style>
  #information {
    position: absolute;
    z-index: 10000;
    top: 0;
    bottom: 0;
    left: 0;
    width: 400px;
  }

  .close {
    position: absolute;
    right: 0;
    top: 0;
    padding: 10px;
    cursor: pointer;
  }

  .row-invert {
    background-color: #d4d4d4;
  }

  #setting {
    position: absolute;
    z-index: 10000;
    top: 20px;
    right: 10px;
    width: 200px;
    max-height: 400px;
    background-color: #ffffff;
  }

  .v-expansion-panel-content__wrap {
    padding: 0;
  }

  .v-list-item__content {
    padding: 10px 15px;
  }

  .v-input--radio-group {
    margin: 0;
  }

  .legend span {
    display: inline-block;
    height: 25px;
    vertical-align: middle;
  }

  .legend img {
    vertical-align: middle;
  }

  .leaflet-marker-icon-color-blue {
    -webkit-filter: hue-rotate(30deg);
    filter: hue-rotate(30deg);
  }

  .leaflet-marker-icon-color-pink {
    -webkit-filter: hue-rotate(90deg);
    filter: hue-rotate(90deg);
  }

  .leaflet-marker-icon-color-red {
    -webkit-filter: hue-rotate(150deg);
    filter: hue-rotate(150deg);
  }

  .leaflet-marker-icon-color-yellow {
    -webkit-filter: hue-rotate(210deg);
    filter: hue-rotate(210deg);
  }

  .leaflet-marker-icon-color-green {
    -webkit-filter: hue-rotate(270deg);
    filter: hue-rotate(270deg);
  }

  .leaflet-marker-icon-color-alua {
    -webkit-filter: hue-rotate(330deg);
    filter: hue-rotate(330deg);
  }

  .leaflet-marker-icon-color-invisible {
    display: none;
  }
</style>
