<template>
  <div class="charging-station">
    <!-- 使用 flex 布局分为左右两栏 -->
    <div class="main-container">
      <!-- 左侧地图 -->
      <div class="map-section">
        <div id="map-container"></div>
      </div>

      <!-- 右侧信息面板 -->
      <div class="info-section">
        <!-- 顶部统计信息 -->
        <div class="stats">
          <el-card class="stat-card">
            <i class="el-icon-house"></i> <span>{{ totalStations }}</span> 个充电站
          </el-card>
          <el-card class="stat-card">
            <i class="el-icon-lightning"></i> <span>{{ totalChargers }}</span> 个充电桩
          </el-card>
        </div>

        <!-- 搜索框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="请输入充电站名称"
          @input="filterStations"
          clearable
        >
          <i slot="prefix" class="el-input__icon el-icon-search"></i>
        </el-input>

        <!-- 充电站信息表格 -->
        <el-table :data="filteredStations" stripe style="width: 100%">
          <el-table-column prop="name" label="充电站名称"></el-table-column>
          <el-table-column prop="publicChargers" label="公用充电桩数量"></el-table-column>
          <el-table-column prop="privateChargers" label="专属充电桩数量"></el-table-column>
          <el-table-column label="操作" width="120">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="locateStation(scope.row)">
                定位
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader";
window._AMapSecurityConfig = {
  securityJsCode: 'eba10de53cfdb8b308b8ccc2f1da70fe'
}
export default {
  data() {
    return {
      map: null,
      searchKeyword: "",
      markers: new Map(),
      infoWindows: new Map(),
      stations: [
        {
          id: "1",
          name: "天河充电站",
          address: "广州市天河区天河路123号",
          image: "https://example.com/image1.jpg",
          longitude: 113.3245,
          latitude: 23.1359,
          publicChargers: 8,
          privateChargers: 4
        },
        {
          id: "2",
          name: "珠江新城充电站",
          address: "广州市天河区珠江新城华夏路456号",
          longitude: 113.3225,
          latitude: 23.1198,
          publicChargers: 12,
          privateChargers: 6
        },
        {
          id: "3",
          name: "白云机场充电站",
          address: "广州市白云区机场路789号",
          longitude: 113.2988,
          latitude: 23.3928,
          publicChargers: 15,
          privateChargers: 5
        }
      ],
      filteredStations: [],
      totalStations: 0,
      totalChargers: 0,
    };
  },
  mounted() {
    this.initMap();
    this.initializeStationData();
  },
  methods: {
    // 初始化高德地图
    async initMap() {
      try {
        const AMap = await AMapLoader.load({
          key: "9affae7b133d953709b03c520468a6d3",
          version: "2.0",
          plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.InfoWindow"],
        });
        
        this.map = new AMap.Map("map-container", {
          zoom: 10,
          center: [113.2644, 23.1291], // 默认中心点（广州）
          viewMode: "3D",
        });

        // 地图加载完成后再添加标记点
        this.map.on('complete', () => {
          this.addMarkers(AMap);
        });

      } catch (error) {
        console.error("地图初始化失败:", error);
      }
    },

    // 替换原来的fetchChargingStations方法
    initializeStationData() {
      this.filteredStations = this.stations;
      this.totalStations = this.stations.length;
      this.totalChargers = this.stations.reduce(
        (sum, station) => sum + station.publicChargers + station.privateChargers,
        0
      );
    },

    // 修改 addMarkers 方法，添加 AMap 参数
    addMarkers(AMap) {
      if (!this.map || !AMap) {
        console.error('地图未初始化');
        return;
      }

      console.log('Adding markers for stations:', this.stations);

      this.stations.forEach(station => {
        console.log('Creating marker for station:', station.name);

        const marker = new AMap.Marker({
          position: new AMap.LngLat(station.longitude, station.latitude),
          title: station.name,
          animation: 'AMAP_ANIMATION_DROP',
          clickable: true
        });

        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 10px 0;">${station.name}</h3>
              <p style="margin: 5px 0;">地址：${station.address}</p>
              <p style="margin: 5px 0;">公共充电桩：${station.publicChargers}个</p>
              <p style="margin: 5px 0;">私人充电桩：${station.privateChargers}个</p>
            </div>
          `,
          offset: new AMap.Pixel(0, -30)
        });

        marker.on('click', () => {
          this.closeAllInfoWindows();
          infoWindow.open(this.map, marker.getPosition());
        });

        marker.setMap(this.map);
        
        // 存储marker和infoWindow的引用
        this.markers.set(station.id, marker);
        this.infoWindows.set(station.id, infoWindow);
        
        console.log('Marker added for:', station.name);
      });

      const bounds = this.map.getBounds();
      this.map.setFitView();
    },

    // 搜索过滤充电站
    filterStations() {
      this.filteredStations = this.stations.filter((station) =>
        station.name.includes(this.searchKeyword)
      );
    },

    // 添加新方法：定位到指定充电站
    locateStation(station) {
      if (!this.map || !this.markers.has(station.id)) return;
      
      // 关闭所有已打开的信息窗口
      this.closeAllInfoWindows();
      
      // 获取对应的标记点和信息窗口
      const marker = this.markers.get(station.id);
      const infoWindow = this.infoWindows.get(station.id);
      
      // 将地图中心设置到该充电站位置
      this.map.setCenter(new AMap.LngLat(station.longitude, station.latitude));
      this.map.setZoom(15); // 设置适当的缩放级别
      
      // 打开信息窗口
      infoWindow.open(this.map, marker.getPosition());
    },

    // 添加新方法：关闭所有信息窗口
    closeAllInfoWindows() {
      this.infoWindows.forEach(infoWindow => {
        infoWindow.close();
      });
    },
  },

  beforeDestroy() {
    if (this.map) {
      this.closeAllInfoWindows();
      this.markers.forEach(marker => {
        marker.setMap(null);
      });
      this.map.destroy();
      this.map = null;
    }
  }
};
</script>

<style scoped>
.charging-station {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

.main-container {
  display: flex;
  gap: 20px;
  height: calc(100% - 40px); /* 减去padding的高度 */
}

/* 左侧地图区域 */
.map-section {
  flex: 2;
  height: 100%;
}

#map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 右侧信息区域 */
.info-section {
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

/* 统计卡片样式 */
.stats {
  display: flex;
  gap: 20px;
}

.stat-card {
  flex: 1;
  text-align: center;
  font-size: 18px;
}

.stat-card span {
  font-weight: bold;
  color: #409EFF;
  margin: 0 5px;
}

/* 搜索框样式 */
.el-input {
  margin-bottom: 20px;
}

/* 表格容器 */
.el-table {
  flex: 1;
  overflow: auto;
}

/* 适配小屏幕 */
@media screen and (max-width: 1200px) {
  .main-container {
    flex-direction: column;
  }
  
  .map-section {
    height: 50%;
  }
  
  .info-section {
    height: 50%;
    min-width: 100%;
  }
}
</style>
  