<template>
  <v-layout
    column
    style="position: relative;"
  >
    <div id="map-wrap" style="height: 100%;">
      <client-only>
        <l-map ref="map" :zoom="zoom" :center="center">
          <l-tile-layer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" :attribution="attribution" />
        </l-map>
      </client-only>
    </div>
    <v-card v-if="information" id="information">
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
                  <v-radio label="人口" value="population" />
                  <v-radio label="世帯数" value="house" />
                </v-radio-group>
              </v-list-item-content>
              <v-divider />
              <v-subheader>対象</v-subheader>
              <v-list-item-content>
                <v-radio-group
                  v-model="population.target"
                  hide-details
                  dense
                  :disabled="population.type === 'house'"
                >
                  <v-radio label="すべて" value="all" />
                  <v-radio label="男性" value="man" />
                  <v-radio label="女性" value="woman" />
                </v-radio-group>
              </v-list-item-content>
              <v-divider />
              <v-subheader>年代</v-subheader>
              <v-list-item-content>
                <v-radio-group
                  v-model="population.generation"
                  hide-details
                  dense
                  :disabled="population.type === 'house'"
                >
                  <v-radio label="すべて" value="all" />
                  <v-radio
                    v-for="(val, idx) in 17"
                    :key="val"
                    :label="`${idx * 5}-${(idx * 5)+4}歳`"
                    :value="idx"
                  />
                  <v-radio label="85歳以上" value="18" />
                </v-radio-group>
              </v-list-item-content>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>施設</v-expansion-panel-header>
          <v-expansion-panel-content>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
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
      }
    }
  },

  watch: {
    population: {
      handler: 'changePopulationTarget',
      deep: true
    }
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
    populationStyling (feature) {
      const style = {
        cols: [],
        colors: []
      }
      if (this.population.type === 'house') {
        style.cols = ['世帯数']
      } else if (this.population.target === 'all' && this.population.generation === 'all') {
        style.cols = ['総人口']
      } else if (this.population.target !== 'all' && this.population.generation === 'all') {
        style.cols = [this.population.target === 'man' ? '男性' : '女性']
      } else if (this.population.target === 'all' && this.population.generation !== 'all') {
        const generation = this.population.generation === '18' ? '85歳以上' : `${this.population.generation * 5}-${this.population.generation * 5 + 4}歳`
        style.cols = [`${generation}の男性`, `${generation}の女性`]
      } else if (this.population.target !== 'all' && this.population.generation !== 'all') {
        const target = this.population.target === 'man' ? '男性' : '女性'
        const generation = this.population.generation === '18' ? '85歳以上' : `${this.population.generation * 5}-${this.population.generation * 5 + 4}歳`
        style.cols = [`${generation}の${target}`]
      }
      return (feature) => {
        const header = feature.properties.header
        const values = feature.properties.values
        let value = 0
        style.cols.forEach((col) => {
          const idx = header.indexOf(col)
          value += Number(values[idx])
        })
        console.log(value)
        return {}
      }
    },
    changePopulationTarget () {
      this.layers.population.setStyle(this.populationStyling())
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
</style>
