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
      >
        <nuxt />
      </v-container>
    </v-content>
    <v-footer
      :fixed="fixed"
      app
    >
      <span>&copy; 2019</span>
    </v-footer>
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
