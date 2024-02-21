<template>
  <el-container class="home_container">
    <el-header style="height: 50px; background-color: #5978E7;">
      <div @click="toggleCollapse" style="cursor: pointer;">
        <img src="../assets/img/CK.png" style="margin-left: 5px;margin-right: -10px;margin-top: 6px; width: 50px;height: 50px" alt="" />
        <span style="font-size: 30px">CK图谱</span>
      </div>
      <div style="margin: 15px 0px 10px -60px">
        <el-row style="font-size: 15px; background-color: #5978E7">
          <span style="margin-right: 10px;color: #ffffff;font-weight: bold;"></span>
          <el-autocomplete class="inline-input" v-model="key" clearable :popper-append-to-body="false"
                           background-color="#5978E7" :fetch-suggestions="queryNode" placeholder="请输入内容" >
            <i slot="prefix" class="el-input__icon el-icon-search" @click="searchKeyWords"></i>
          </el-autocomplete>
<!--          <i class="el-icon-search" circle @click="searchKeyWords" style="fong-weight:bold;background: #5978E7;margin-left: 10px"></i>-->
<!--          <el-button icon="el-icon-search" circle @click="searchKeyWords" style="fong-weight:bold;background: #5978E7;margin-left: 10px"></el-button>-->
        </el-row>
      </div>
      <div class="btn-fullscreen" @click="handleFullScreen">
        <el-tooltip effect="dark" :content="fullscreen ? `取消全屏` : `全屏`" placement="bottom">
          <i class="el-icon-star-off"></i>
        </el-tooltip>
      </div>
    </el-header>

    <el-container>
      <el-aside :width="isCollapse ? '0px':'170px'">
        <el-menu background-color="#2B438F" text-color="white" unique-opened
                 :collapse="isCollapse" :collapse-transition="false" :router="true" style="margin-top: 40px;">
          <el-menu-item :index="'/ckGraph'" style="padding-left: 15px;">
<!--            <i class="el-icon-search" style="color: white"></i>-->
            <img src="../assets/svg/star.svg" width="20" height="20" style="color: white;margin-right: 15px">
            <span slot="title" style="color: white;font-family: elementIcons,serif;font-weight: bold;font-size: 17px">ckGraph</span>
          </el-menu-item>
          <el-menu-item :index="'/view2D'" style="padding-left: 15px;">
            <img src="../assets/svg/documentation.svg" width="20" height="20" style="color: white;margin-right: 15px">
            <span slot="title" style="color: white;font-family: elementIcons,serif;font-weight: bold;font-size: 17px">view2D</span>
          </el-menu-item>
          <el-menu-item :index="'/dashBoard'" style="padding-left: 15px;">
            <img src="../assets/svg/category.svg" width="20" height="20" style="color: white;margin-right: 15px">
            <span slot="title" style="color: white;font-family: elementIcons,serif;font-weight: bold;font-size: 17px">dashBoard</span>
          </el-menu-item>
          <el-menu-item :index="'/CCC'" style="padding-left: 15px;">
            <img src="../assets/svg/category.svg" width="20" height="20" style="color: white;margin-right: 15px">
            <span slot="title" style="color: white;font-family: elementIcons,serif;font-weight: bold;font-size: 17px">CCC</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
/*eslint-disable*/
export default {
  data () {
    return {
      isCollapse: false, // 是否折叠
      fullscreen: false,
      AllKeyWord: [],
      key: '',
    }
  },
  mounted () {
    this.AllKeyWord = this.loadAllKeyWord();
    // const key = { key: '' }
    sessionStorage.setItem('key', JSON.stringify(''))
  },
  methods: {
    searchKeyWords () {
      // this.$emit('key', this.key);
      // this.$router.push({ path: '/ckGraph', query: { key: this.key } })
      const key = { key: this.key }
      sessionStorage.setItem('key', JSON.stringify(this.key))
      location.reload();
      // this.$router.replace('/ckGraph');
    },
    queryNode(queryString, cb) {
      let AllKeyWord = this.AllKeyWord;
      let results = queryString ? AllKeyWord.filter(this.createFilter(queryString)) : AllKeyWord;
      cb(results);       // 调用 callback 返回建议列表的数据
    },
    createFilter(queryString) {
      return (label) => {
        return (label.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
      };
    },
    loadAllKeyWord() {
      return [
        { "value": "WMC"}, { "value": "DIT"}, { "value": "NOC"},
        { "value": "RFC"}, { "value": "CBO"}, { "value": "LCOM"},
      ];
    },
    toggleCollapse () { // 点击按钮，切换菜单的折叠与展开
      this.isCollapse = !this.isCollapse
    },
    handleFullScreen() { // 全屏事件
      let element = document.documentElement;
      if (this.fullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } else {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullScreen) {
          element.webkitRequestFullScreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          // IE11
          element.msRequestFullscreen();
        }
      }
      this.fullscreen = !this.fullscreen;
      this.footerVisible = !this.footerVisible;
    },

  },
}
</script>

<style lang="scss" scoped>
.home_container {
  height: 100%;
  overflow: hidden;
}

.el-header{
  line-height: 20px;
  background-color: #60a8f1e3;
  display: flex;
  justify-content: space-between;
  padding-left: 0;
  align-items: center;
  color: #fff;
  font-size: 20px;
  > div {
    display: flex;
    align-items: center;
    span {
      margin-left: 15px;
    }
  }
}

.el-aside {
  position: absolute;
  height: 500px;
  bottom: 150px;
  left: 10px;
  background-color: #2B438F;
  border-radius: 5px;
  z-index: 2;
  clip-path: polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%,
      100% 100%, 30px 100%, 0 calc(100% - 30px), 0 0);
  .el-menu {
    border-right: none;
  }
  img{
    filter: drop-shadow(#ffffff 100px 0); //别管，就这样才可以
    transform: translateX(-100px);
  }
}

.el-aside::-webkit-scrollbar {
  display: none;
}

.el-main {
  background-color: rgba(82, 114, 230, 0.96);
  padding: 5px;
}

::v-deep .inline-input .el-input__inner{
  background-color: #5978E7;
  border-radius: 18px;
  color: #ffffff;
}
</style>
