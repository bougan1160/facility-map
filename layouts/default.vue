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
      <v-dialog
        v-model="dialog"
        width="500"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            text
            v-on="on"
          >
            データについて
          </v-btn>
        </template>

        <v-card>
          <v-card-title
            class="headline grey lighten-2"
            primary-title
          >
            データについて
          </v-card-title>

          <v-card-text>
            本ページは以下のデータを用いています。
            <ul>
              <li>
                高砂市オープンデータ（<a href="http://www.city.takasago.lg.jp/index.cfm/19,0,184,1031,html">http://www.city.takasago.lg.jp/index.cfm/19,0,184,1031,html</a>):<br> 施設別カルテ一覧_2017年度、地域別年齢別人口_20191129
              </li>
              <li>
                e-Stat（<a href="https://www.e-stat.go.jp">https://www.e-stat.go.jp</a>):<br> 境界データ(国勢調査2015年)
              </li>
            </ul>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              @click="dialog = false"
            >
              閉じる
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-app-bar>
    <v-content>
      <v-container
        fluid
        fill-height
        class="pa-0"
        style="position: relative;z-index: 1"
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
      title: '公共施設カルテ',
      dialog: false
    }
  }
}
</script>
