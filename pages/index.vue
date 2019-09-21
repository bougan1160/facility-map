<template>
  <v-layout
    column
  >
    <v-flex
      grow
    >
      <div id="map-wrap" style="height: 100%;">
        <no-ssr>
          <l-map :zoom="zoom" :center="center">
            <l-tile-layer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" :attribution="attribution" />
          </l-map>
        </no-ssr>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  data () {
    return {
      center: [34.76638, 134.79688],
      zoom: 14,
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }
  }
}
</script>
