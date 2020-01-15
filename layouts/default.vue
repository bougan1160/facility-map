<template>
  <v-app light>
    <v-app-bar
      :clipped-left="clipped"
      absolute
      flat
      app
    >
      <v-toolbar-title v-text="title" />
      <v-spacer />
    </v-app-bar>
    <v-content>
      <v-container
        fluid
        fill-height
        class="pa-0"
      >
        <nuxt />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      clipped: false,
      title: 'Facility Karte'
    }
  }
}
</script>
