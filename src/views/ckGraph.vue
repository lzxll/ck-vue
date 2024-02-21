<template>
  <div>
    <div ref="graph" id="graph"></div>

    <div id="dashBoard">

    </div>

    <div id="indicator"> <!-- 绘制图例 -->
      <!--    <el-button type="primary" @click="back" v-if="showBack">返回</el-button>-->
      <div v-if="showIndicator" v-for="(name, index) in labels" :key="index"> <!-- 利用item 遍历一个数组 利用index 遍历另外一个数组 -->
        <span
            :data-index="index"
            style="cursor: pointer;"
            :style="{ backgroundColor: nodeColors[index] }">
        </span>
        {{ name }}
      </div>
    </div>

    <dashBoard />
  </div>
</template>

<script>
import ForceGraph3D from '3d-force-graph'
import SpriteText from 'three-spritetext'
import dashBoard from '../components/dashBoard.vue'

export default {
  name: 'ckGraph',
  components: {
    dashBoard
  },
  data(){
    return{
      Graph: null,
      data: [],
      json: require('@/assets/data/records.json'),
      db: {
        uri: 'bolt://localhost:7689',
        user: 'neo4j',
        password: 'luo19972002'
      },
      nodes: [],
      links: [],
      keyword: null,
      nodeSearch: [],
      linkSearch: [],
      nodeColors: ['#f1395b', '#efe678', '#5ceac7'],
      labels: ['度量元', '知识点', '学科'],
      linkTypes: ['', '包含', '关联'],
      showIndicator: true,
    }
  },
  mounted () {
    this.keyword = JSON.parse(sessionStorage.getItem('key'));
    console.log(this.keyword)
    this.d3jsonParser(this.json)
    this.initData()
    sessionStorage.setItem('key', JSON.stringify(''))
  },
  methods: {
    d3jsonParser (json) { // 解析json数据，主要负责数据的去重、标准化
      const nodes =[] // 存放节点和关系
      const links = []
      const nodeSet = [] // 存放去重后nodes的id

      for (let item of json) {
        for (let segment of item.p.segments) {// 重新更改data格式
          if (nodeSet.indexOf(segment.start.identity) === -1) {
            nodeSet.push(segment.start.identity)
            nodes.push({
              id: segment.start.identity,
              label: segment.start.labels[0],
              properties: segment.start.properties,
            })
          }
          if (nodeSet.indexOf(segment.end.identity) === -1) {
            nodeSet.push(segment.end.identity)
            nodes.push({
              id: segment.end.identity,
              label: segment.end.labels[0],
              properties: segment.end.properties
            })
          }
          links.push({
            source: segment.relationship.start,
            target: segment.relationship.end,
            type: segment.relationship.type,
            properties: segment.relationship.properties
          })
        }
      }
      this.data = { nodes, links }
      console.log(nodes)
      console.log(links)
    },
    initData () {
      this.nodes = this.data.nodes
      this.links = this.data.links
      this.nodeSearch = this.data.nodes
      this.linkSearch = this.data.links
      if(this.keyword) this.searchKeyWord()
      else this.renderData()
    },
    searchKeyWord () {
      console.log("search:start!!!!!!----------------------------------------")

      let key = this.keyword
      let node_temp = null
      let ganLian = []
      let nodeSet = []
      this.nodeSearch = []
      this.linkSearch = []

      // 添加节点
      for (let i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].properties.name.indexOf(key) >= 0) {
          node_temp = this.nodes[i];
          nodeSet.push(this.nodes[i].id)
          this.nodeSearch.push(this.nodes[i]);
          break;
        }
      }

      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = 0; j < this.links.length; j++) {
          // let sourceId = null
          // let targetId = null
          // if(this.links[j].source.id !== null) sourceId = this.links[j].source.id;
          // else sourceId = this.links[j].source;
          // if(this.links[j].target.id !== null) targetId = this.links[j].target.id;
          // else targetId = this.links[j].target;
          //
          // if (sourceId === this.nodes[i].id && targetId === node_temp.id && nodeSet.indexOf(this.nodes[i].id) === -1) {
          //   nodeSet.push(this.nodes[i].id);
          //   this.nodeSearch.push(this.nodes[i]);
          // }
          // if (targetId === this.nodes[i].id && sourceId === node_temp.id && nodeSet.indexOf(this.nodes[i].id) === -1) {
          //   nodeSet.push(this.nodes[i].id);
          //   ganLian.push(this.nodes[i]);
          //   this.nodeSearch.push(this.nodes[i]);
          // }
          if (this.links[j].source === this.nodes[i].id && this.links[j].target === node_temp.id && nodeSet.indexOf(this.nodes[i].id) === -1) {
            nodeSet.push(this.nodes[i].id);
            this.nodeSearch.push(this.nodes[i]);
          }
          if (this.links[j].target === this.nodes[i].id && this.links[j].source === node_temp.id && nodeSet.indexOf(this.nodes[i].id) === -1) {
            nodeSet.push(this.nodes[i].id);
            ganLian.push(this.nodes[i]);
            this.nodeSearch.push(this.nodes[i]);
          }
        }
      }
      console.log(ganLian)
      for (let j = 0; j < ganLian.length; j++) {
        for (let i = 0; i < this.links.length; i++) {
          if(this.links[i].target === ganLian[j].id && this.links[i].type === "包含"){
            for (let k = 0; k < this.nodes.length; k++) {
              if (this.links[i].source === this.nodes[k].id && nodeSet.indexOf(this.nodes[k].id) === -1) {
                nodeSet.push(this.nodes[k].id);
                this.nodeSearch.push(this.nodes[k]);
              }
            }
          }
        }
      }

      // 添加关系
      this.links.filter(link => { // 遍历保留节点的关联关系
        if (link.source === node_temp.id || link.target === node_temp.id){
          this.linkSearch.push(link);
          return true;
        }

        for (let j = 0; j < ganLian.length; j++){
          if(link.target === ganLian[j].id && link.type === "包含"){
            this.linkSearch.push(link);
            return true;
          }
        }
      })

      this.renderData()
    },
    renderData () {
      console.log("renderData:start!!!!!------------------------------------------------")
      console.log(this.nodeSearch)
      console.log(this.linkSearch)

      this.Graph = ForceGraph3D()(this.$refs.graph).graphData({ nodes: this.nodeSearch, links: this.linkSearch })
          .backgroundColor('#162864').width(1320).height(900).showNavInfo(false)
          .nodeOpacity(0.65)
          .nodeVal(node =>{
            let size =10
            for(let i = 0; i < this.labels.length; i++)
              if(node.label === this.labels[i])
                size = size + i * 7;
            return size
          })
          .nodeColor(node => {
            let i = 0
            for (;i < this.labels.length;i++)
              if (node.label === this.labels[i])
                break
            return this.nodeColors[i]
          })
          .nodeThreeObjectExtend(true)
          .nodeThreeObject(node => {
            const sprite = new SpriteText(node.properties.name)
            sprite.material.depthWrite = false
            let i = 0
            for (;i < this.labels.length;i++)
              if (node.label === this.labels[i])
                break
            sprite.color = this.nodeColors[i]
            sprite.textHeight = 4
            return sprite
          })
          .nodeLabel(node => `${node.properties.name}`)
          .onNodeHover(node => this.$refs.graph.style.cursor = node ? 'pointer' : null)
          .onNodeClick((node, event) => {
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            const newPos = node.x || node.y || node.z
                ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
                : { x: 0, y: 0, z: distance };
            this.Graph.cameraPosition(newPos, node, 3000);

            this.selectNodeData = {}
            this.$set(this.selectNodeData, 'label', node.label);
            this.$set(this.selectNodeData, 'id', node.id);
            this.$set(this.selectNodeData, 'name', node.properties.name);
            let i = 0
            for (;i < this.labels.length;i++)
              if (node.label === this.labels[i])
                break
            this.$set(this.selectNodeData, 'color', this.nodeColors[i]);
            this.$set(this.selectNodeData, 'properties', node.properties);
          })
          .linkOpacity(0.5)
          .linkVisibility(true)
          .linkDirectionalArrowLength(3.5)
          .linkDirectionalArrowRelPos(1)
          .linkCurvature(0.25)
          .linkWidth(1)
          // .linkAutoColorBy(r => r.type)
          .linkColor(link => {
            let i = 0
            for (;i < this.linkTypes.length;i++)
              if (link.type === this.linkTypes[i])
                break
            return this.nodeColors[i]
          })
          .linkThreeObjectExtend(true)
          .linkThreeObject(link => {
            const sprite = new SpriteText(`${link.type}`);
            for (let i = 0;i < this.linkTypes.length;i++)
              if (link.type === this.linkTypes[i])
                sprite.color = this.nodeColors[i]

            sprite.textHeight = 4;
            sprite.fontWeight = "bold";
            return sprite;
          })
          .linkLabel(r => r.type)
          .onLinkClick((link, event) => {
            console.log(link.type)
          })
          .linkPositionUpdate((sprite, { start, end }) => {
            const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
              [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
            })))
            // Position sprite
            Object.assign(sprite.position, middlePos);
          })
          .linkDirectionalParticles(20)
          .linkDirectionalParticleSpeed(d => 20 * 0.001);

      this.Graph.d3Force('charge').strength(-150) // this.Graph.d3Force('link').distance(this.space);
    },
  }
}
</script>

<style lang="scss" scoped>
@media only screen and (max-width: 1200px){
  #info, #indicator {
    display: none !important;
  }
}

#graph{
  border-radius: 5px;
  background-color: #162864;
  //height: 764px;
  height: 900px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

#indicator {
  position: absolute;
  left: 50px;
  bottom: 30px;
  text-align: left;
  color: #f2f2f2;
  font-size: 14px;
  font-weight: bold;
  & > div {
    margin-bottom: 4px;
  }
  span {
    display: inline-block;
    width: 32px;
    height: 16px;
    position: relative;
    top: 2px;
    margin-right: 8px;
  }
}

#Component{
  position: absolute;
  right: 150px;
  bottom: 20px;
  text-align: left;
  color: #f2f2f2;
  font-size: 14px;
  font-weight: bold;
  & > div {
    margin-bottom: 4px;
  }
  span {
    display: inline-block;
    width: 32px;
    height: 16px;
    position: relative;
    top: 2px;
    margin-right: 8px;
  }
}


#dashBoard {
  position: absolute;
  font-size: 16px;
  top: 30px;
  right: 20px;
  width: 300px;
  .node-card {
    border: 1px solid #9faecf;
    background-color: #00aeff6b;
    color: #fff;
    text-align: left;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}
</style>
