<template>
    <div id="container"></div>
  </template>
  
  <script>
  import AMapLoader from '@amap/amap-jsapi-loader'
  import bus from '@/bus/bus'
  window._AMapSecurityConfig = {
    securityJsCode: 'eba10de53cfdb8b308b8ccc2f1da70fe'
  }
  export default {
    data() {
      return {
        map: null,
        autoOptions: {
          input: ''
        },
        searchPlaceInput: '',
        auto: null,
        placeSearch: null,
        district: null,
        polygons: [],
        showHeatOrNot: false,
        heatmap: null,
        heatmapList: []
      }
    },
    methods: {
      initMap() {
        AMapLoader.load({
          key: '9affae7b133d953709b03c520468a6d3', // 申请好的Web端开发者Key，首次调用 load 时必填
          version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
          plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.HawkEye', 'AMap.MapType', 'AMap.Geolocation', 'AMap.AutoComplete', 'AMap.PlaceSearch', 'AMap.LabelsLayer'] // 需要使用的的插件列表，如比例尺'AMap.Scale'等
        })
          .then(AMap => {
            this.map = new AMap.Map('container', {
              //设置地图容器id
              viewMode: '3D', //是否为3D地图模式
              zoom: 10, //初始化地图级别
              center: [121.473667, 31.230525], //初始化地图中心点位置
              features: ['bg', 'road', 'building', 'point'], // 添加这行来显示地图要素
              showLabel: true  // 添加这行来显示文字标注
            })
            this.map.addControl(new AMap.Scale())
            this.map.addControl(new AMap.ToolBar())
            this.map.addControl(new AMap.HawkEye())
            this.map.addControl(new AMap.MapType())
            this.map.addControl(new AMap.Geolocation())
            this.auto = new AMap.AutoComplete(this.autoOptions)
            this.placeSearch = new AMap.PlaceSearch({
              map: this.map
            }) //构造地点查询类
            this.auto.on('select', this.select)
          })
          .catch(e => {
            console.log(e)
          })
      },
      select(e) {
        this.placeSearch.setCity(e.poi.adcode)
        this.placeSearch.search(e.poi.name) //关键字查询查询
        this.drawBounds(e.poi.name)
        this.map.setZoom(16, true, 1)
      },
      // 行政区区域划分
      drawBounds(newValue) {
        //加载行政区划插件
        if (!this.district) {
          //实例化DistrictSearch
          var opts = {
            subdistrict: 1, //获取边界不需要返回下级行政区
            extensions: 'all', //返回行政区边界坐标组等具体信息
            level: 'district' //查询行政级别为 市
          }
  
          this.map.plugin(['AMap.DistrictSearch'], () => {
            this.district = new AMap.DistrictSearch(opts)
          })
          // this.district = new AMap.DistrictSearch(opts)
        }
        //行政区查询
        this.district.search(newValue, (status, result) => {
          console.log(result)
          if (result != null) {
            this.feedBack('区域搜索成功', 'success')
            if (this.polygons != null) {
              this.map.remove(this.polygons) //清除上次结果
              this.polygons = []
            }
            var bounds = result.districtList[0].boundaries
            if (bounds) {
              for (var i = 0, l = bounds.length; i < l; i++) {
                //生成行政区划polygon
                var polygon = new AMap.Polygon({
                  strokeWeight: 1,
                  path: bounds[i],
                  fillOpacity: 0.4,
                  fillColor: '#80d8ff',
                  strokeColor: '#0091ea'
                })
                this.polygons.push(polygon)
              }
            }
            this.map.add(this.polygons)
            this.map.setFitView(this.polygons) //视口自适应
          } else {
            this.feedBack('区域搜索失败', 'error')
          }
        })
      },
      feedBack(msg, feedBackType) {
        this.$message({
          showClose: true,
          message: msg,
          type: feedBackType
        })
      },
      showHeatMap() {
        this.map.plugin(['AMap.PlaceSearch'], () => {
          //构造地点查询类
          var placeSearch = new AMap.PlaceSearch({
            pageSize: 50, // 单页显示结果条数
            pageIndex: 1, // 页码
            city: this.searchPlaceInput, // 兴趣点城市
            citylimit: true //是否强制限制在设置的城市内搜索
            //map: this.map, // 展现结果的地图实例
            // panel: 'panel', // 结果列表将在此容器中进行展示。
            // autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
          })
          //关键字查询
          placeSearch.search('商场', (status, result) => {
            // console.log(result)
  
            this.getHotChartPos('商场', result)
          })
        })
        this.$notify({
          title: '成功',
          message: '热力图获取成果，但是由于电脑性能，我们仅加载部分数据',
          type: 'success'
        })
      },
      getHotChartPos(detail, result) {
        let lengthSize = result.poiList.pageSize
        const count = result.poiList.count
        // const lengthPage = count / lengthSize
        if (lengthSize > count) {
          lengthSize = count
        }
        for (var n = 0; n < lengthSize; n++) {
          // this.map.plugin(['AMap.PlaceSearch'], () => {
          //构造地点查询类
          var realSearch = new AMap.PlaceSearch({
            pageSize: 50, // 单页显示结果条数
            pageIndex: n + 1, // 页码
            city: this.searchPlaceInput, // 兴趣点城市
            citylimit: true //是否强制限制在设置的城市内搜索
            // map: this.map, // 展现结果的地图实例
            // panel: 'panel', // 结果列表将在此容器中进行展示。
            // autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
          })
          realSearch.search(detail, (status, result) => {
            // for (var j = 0; j < 50; j++) {
            // this.map.remove(this.map.getAllOverlays('marker'))
            //var centerPoint = [result.poiList.pois[j].location.lng, result.poiList.pois[j].location.lat]
            // console.log(result)
            //热力图
            this.showHatChart(result)
            // }
          })
        }
      },
      showHatChart(result) {
        var info = []
        for (let i = 0; i < 50; i++) {
          info.push({
            lng: result.poiList.pois[i].location.lng,
            lat: result.poiList.pois[i].location.lat,
            count: 3 * 50 * Math.round(Math.random() * (10 - 2) + 2)
          })
        }
  
        this.map.plugin(['AMap.HeatMap'], () => {
          //初始化heatmap对象
          this.heatmap = new AMap.HeatMap(this.map, {
            radius: 56, //给定半径
            opacity: [0, 0.5]
            /*,
              gradient:{
                  0.5: 'blue',
                  0.65: 'rgb(117,211,248)',
                  0.7: 'rgb(0, 255, 0)',
                  0.9: '#ffea00',
                  1.0: 'red'
              }
               */
          })
          //设置数据集
          this.heatmap.setDataSet({
            data: info,
            max: 100
          })
          this.heatmapList.push(this.heatmap)
          this.heatmap.show()
        })
      }
    },
    mounted() {
      //DOM初始化完成进行地图初始化
      this.initMap()
    },
    created() {
      bus.$on('shareSearchData', val => {
        this.autoOptions.input = val.inputId
        this.searchPlaceInput = val.userInput
      })
      bus.$on('shareHeatMapShow', val => {
        this.showHeatOrNot = val
      })
    },
    watch: {
      searchPlaceInput(newValue) {
        if (newValue != null) {
          console.log(newValue)
          this.placeSearch.search(newValue)
          this.drawBounds(newValue)
          this.map.setZoom(16, true, 1)
        }
      },
      showHeatOrNot(newValue) {
        if (newValue) {
          this.showHeatMap()
        } else {
          // Hide and clear all heatmaps
          if (this.heatmap) {
            this.heatmap.hide()
          }
          if (this.heatmapList && this.heatmapList.length) {
            this.heatmapList.forEach(heatmap => {
              heatmap.hide()
            })
            this.heatmapList = [] // Clear the array
          }
        }
      }
    }
  }
  </script>
  
  <style scoped>
  #container {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
  }
  #map_wrap {
    transform: translate(-50%, -50%);
  }
  </style>
  