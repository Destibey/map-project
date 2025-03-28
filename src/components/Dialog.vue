<template>
  <div>
    <!-- 地址输入框 -->
    <el-input v-model="address" placeholder="请输入地址" @keyup.enter="handleSearch">
      <el-button slot="append" icon="el-icon-search" @click="handleSearch">搜索</el-button>
    </el-input>

    <!-- 地图弹窗 -->
    <el-dialog title="选择位置" :visible.sync="dialogVisible" width="60%" @opened="initMap">
      <div class="search-box" style="margin-bottom: 10px;">
        <el-input v-model="searchKeyword" placeholder="搜索地址" style="width: 300px;">
          <el-button slot="append" @click="searchAddress">搜索</el-button>
        </el-input>
      </div>
      <div id="map-container" style="width: 100%; height: 400px;"></div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmLocation">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      address: '', // 选定的地址
      searchKeyword: '', // 地图内搜索关键词
      dialogVisible: false, // 控制弹窗显示
      map: null, // 地图实例
      marker: null, // 地图标记
      placeSearch: null, // 地点搜索服务
      geocoder: null, // 地址解析实例
      selectedLngLat: null, // 选定的经纬度
      mapLoaded: false, // 地图是否已加载
    };
  },
  // 添加生命周期钩子，确保组件销毁时清理资源
  beforeDestroy() {
    if (this.map) {
      this.map.destroy();
    }
  },
  methods: {
    // 处理搜索按钮点击
    handleSearch() {
      if (!this.address) {
        this.$message.warning('请输入地址');
        return;
      }
      this.searchKeyword = this.address;
      this.dialogVisible = true;
    },

    // 初始化地图
    async initMap() {
      if (!window._AMapSecurityConfig) {
        window._AMapSecurityConfig = {
          securityJsCode: 'eba10de53cfdb8b308b8ccc2f1da70fe' // 替换为您的安全密钥
        };
      }

      try {
        await this.loadAMapScript();
        if (!this.map) {
          this.createMap();
        }
        // 如果有搜索关键词，直接搜索
        if (this.searchKeyword) {
          this.searchAddress();
        }
      } catch (error) {
        console.error('地图加载失败:', error);
        this.$message.error('地图加载失败，请刷新重试');
      }
    },

    // 加载高德地图脚本
    loadAMapScript() {
      return new Promise((resolve, reject) => {
        if (window.AMap) {
          resolve();
          return;
        }

        const callback = `initAMap_${Date.now()}`;
        window[callback] = resolve;

        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=9affae7b133d953709b03c520468a6d3&plugin=AMap.PlaceSearch,AMap.Geocoder&callback=${callback}`;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    // 创建地图实例
    createMap() {
      this.map = new AMap.Map('map-container', {
        zoom: 14,
        center: [116.397428, 39.90923]
      });

      // 初始化搜索服务
      this.placeSearch = new AMap.PlaceSearch({
        map: this.map
      });

      this.geocoder = new AMap.Geocoder();

      // 点击地图事件
      this.map.on('click', (e) => {
        const lngLat = [e.lnglat.getLng(), e.lnglat.getLat()];
        this.selectedLngLat = lngLat;
        this.addMarker(lngLat);
        this.getAddressFromLngLat(lngLat);
      });
    },

    // 搜索地址
    searchAddress() {
      if (!this.searchKeyword) return;
      
      this.placeSearch.search(this.searchKeyword, (status, result) => {
        if (status === 'complete' && result.poiList.pois.length > 0) {
          const poi = result.poiList.pois[0];
          const lngLat = [poi.location.lng, poi.location.lat];
          this.selectedLngLat = lngLat;
          this.address = poi.address;
          this.addMarker(lngLat);
          this.map.setCenter(lngLat);
        } else {
          this.$message.warning('未找到相关地址');
        }
      });
    },

    // 在地图上添加标记
    addMarker(lngLat) {
      if (this.marker) {
        this.marker.setMap(null);
      }
      this.marker = new AMap.Marker({
        position: lngLat,
        map: this.map,
      });
      this.map.setCenter(lngLat);
    },

    // 通过经纬度获取地址
    getAddressFromLngLat(lngLat) {
      this.geocoder.getAddress(lngLat, (status, result) => {
        if (status === 'complete' && result.regeocode) {
          this.address = result.regeocode.formattedAddress;
        } else {
          this.$message.warning('获取地址信息失败');
        }
      });
    },
    
    // 通过地址获取经纬度
    getLngLatFromAddress(address) {
      if (!address || !this.geocoder) return;
      
      this.geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length) {
          const lnglat = result.geocodes[0].location;
          this.selectedLngLat = [lnglat.getLng(), lnglat.getLat()];
          this.addMarker(this.selectedLngLat);
        }
      });
    },

    // 确认选择
    confirmLocation() {
      if (!this.selectedLngLat || !this.address) {
        this.$message.warning('请先选择位置');
        return;
      }

      const locationData = {
        address: this.address,
        lnglat: this.selectedLngLat
      };

      // 发送到父组件
      this.$emit('location-selected', locationData);
      
      // 发送到后端
      this.sendToBackend(locationData);
      
      this.dialogVisible = false;
    },

    // 发送数据到后端
    async sendToBackend(data) {
      try {
        const response = await this.$axios.post('/api/location', data);
        if (response.data.success) {
          this.$message.success('位置信息保存成功');
        } else {
          this.$message.error('位置信息保存失败');
        }
      } catch (error) {
        console.error('保存位置信息失败:', error);
        this.$message.error('保存位置信息失败，请重试');
      }
    },
  },
};
</script>

<style scoped>
.search-box {
  padding: 10px;
  background-color: #fff;
  z-index: 1000;
}
</style>