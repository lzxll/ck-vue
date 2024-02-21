<template>
  <div class="gContainer">
    <ckGraph
        :data="data"
        :labels="labels"
        :linkTypes="linkTypes"
    />
  </div>
</template>

<script>
/*eslint-disable*/
import ckGraph from './ckGraph.vue'
export default {
  name: 'ckGraph',
  components: {
    ckGraph,
  },
  data () {
    return { // d3jsonParser()处理 json 后返回的结果
      data: {
        nodes: [],
        links: []
      },
      json: require('@/assets/data/aaa.json'),
      db: {
        uri: 'bolt://localhost:7689',
        user: 'neo4j',
        password: 'luo19972002'
      },
      labels: ['A', 'B', 'C'],
      linkTypes: ['', '包含', '关联']
    }
  },
  mounted() {
    console.log(this.json)
    this.d3jsonParser(this.json)
  },
  methods: { // 视图更新
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
    }
  }
}
</script>

<style lang="scss" scoped>
.gContainer {
  height: 740px;
  position: relative;
  background-color: black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 5px;
}
</style>
