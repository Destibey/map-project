<template>
  <div id="home_container">
    <!-- 搜索框 -->
    <div id="search_wrap">
       <search></search>
    </div>
    <!-- 展示地图 -->
    <div id="map_wrap">
      <map-container></map-container>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import MapContainer from '@/components/container/MapContainer.vue'
import Search from '@/components/search/Search.vue'
import bus from '@/bus/bus';
export default {
  name: 'HomeView',
  components: {
    MapContainer,
    Search
  }
}
</script>
<style scoped>
  #home_container {
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: rgb(54, 82, 54);
  }
  #search_wrap {
    width: 100%;
    height: 100px;
  }
  #map_wrap {
    z-index: 10;
    position: absolute;
    top: 50%;
    left: 50%;
    height: 70%;
    width: 80%;
    transform: translate(-50%, -50%);
  }
</style>