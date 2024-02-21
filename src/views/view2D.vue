<template>
  <div style="overflow: hidden;">
    <div id="mode">
      <div class="gState" style="margin-top: 10px; font-family: HeFeng,serif">
        <span
            @click="changeTextState(0)"
            :class="{ active: isShowText }"
            style="border-top-right-radius:0;border-bottom-right-radius:0;">显示</span>
        <span
            @click="changeTextState(2)"
            :class="{ active: textState === 2 }"
            style="border-top-left-radius:0;border-bottom-left-radius:0;position:relative;left:-5px;">隐藏</span>
      </div>
      <p class="font-sky" style="text-align: left;">
        <strong>节点个数：{{ nodeSearch.length }}</strong>
        <br>
        <strong>关系个数：{{ linkSearch.length }}</strong>
      </p>
    </div>

<!--    <svg id="graph" width="1340" height="748"></svg>-->
    <svg id="graph" width="1440" height="900"></svg>

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
import * as d3 from 'd3'
import dashBoard from "@/components/dashBoard.vue";

export default {
  name: 'view2D',
  components: {
    dashBoard
  },
  data(){
    return{
      Graph: null,
      data: [],
      json: require('@/assets/data/records.json'),
      nodes: [],
      links: [],
      keyword: null,
      nodeSearch: [],
      linkSearch: [],
      nodeColors: ['#31d01a', '#ef5604', '#e8cb53'],
      labels: ['知识点', '度量元', '学科'],
      linkTypes: ['', '包含', '关联'],
      menu: [ // 右击事件的菜单栏
        {
          title: '隐藏节点',
          action: (elm, d) => {
            this.nodeSearch = this.nodes.filter(node => { // 遍历删除节点
              if (node.id === d.id) return false
              else return true
            })
            this.linkSearch = this.links.filter(link => { // 遍历删除关系
              if (link.source.id === d.id || link.target.id === d.id) return false
              else return true //如果d.id==开始结点id||结束结点的id,删除，否则保留
            })
            this.renderData() // 重新渲染图
          },
          disabled: false
        },
        {
          title: '显示节点关联图',
          action: (elm, d) => {
            console.log(d)
            this.nodeSearch = this.nodes.filter(node => { // 遍历保留对应节点
              if (node.id === d.id) return true
              else {
                for (let i = 0; i < this.links.length; i++) {
                  if (this.links[i].source.id === node.id && this.links[i].target.id === d.id) {
                    console.log(this.links[i].source)
                    return true // 如果links的起点等于选中的node，并且终点等于正在处理的则显示
                  }
                  if (this.links[i].target.id === node.id && this.links[i].source.id === d.id) {
                    return true // 如果links的终点等于选中的node，并且终点等于正在处理的则显示
                  }
                }
                return false
              }
            })
            this.linkSearch = this.links.filter(link => { // 遍历保留节点的关联关系
              if (link.source.id === d.id || link.target.id === d.id) return true
              else return false //如果d.id==开始结点id||结束结点的id,删除，否则保留
            })
            this.renderData() // 重新渲染图
          }
        },
        {
          title: '显示所有查询节点',
          action: (elm, d) => {
            this.nodeSearch = this.data.nodes
            this.linkSearch = this.data.links // 遍历保留节点的关联关系
            this.renderData() // 重新渲染图
          }
        }
      ],
      showIndicator: true,
      selectNodeData: {}, // 选中节点的详细信息展示
      isNodeClicked: false, // 是否点击（选中）节点
      temp: {}, // 临时存储编辑时的节点信息
      textState: 0,
    }
  },
  computed: {
    isShowText: function () {
      return this.textState === 0
    },
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
      this.Graph = d3.select('#graph')  // 获取graph的DOM元素 Graph
      this.Graph.on('.', null) // 移除graph和元素注册事件，防止内存泄漏
      this.Graph.selectAll('*').on('.', null)
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
    renderData(){
      console.log(this.nodeSearch)
      console.log(this.linkSearch)

      let _this = this
      _this.Graph.selectAll('*').remove()
      let graph = _this.Graph
          .on('click', () => {
            this.isNodeClicked = false;
            this.clearGraphStyle();
          })
          .call(d3.zoom().on('zoom', event => {
            let scale = event.transform.k, translate = [event.transform.x, event.transform.y];
            graph.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
          }))
          .append('g').attr('width', '100%').attr('height', '100%')

      this.addMarkers()
      let forceCollide = d3.forceCollide() // 定义碰撞检测模型
          .radius(d => { return 16 * 3 })
          .iterations(0.15)
          .strength(0.75)

      let simulation = d3.forceSimulation(this.nodeSearch) // 利用d3.forceSimulation()定义关系图
          .force("link", d3.forceLink().id(d => d.id))
          .force("charge", d3.forceManyBody().strength(-100))
          .force("center", d3.forceCenter(graph.node().parentElement.clientWidth / 2, graph.node().parentElement.clientHeight / 2))
          .force("collision", forceCollide)

      let link = graph.append("g")
          .attr("class", "links")
          .selectAll("line")
          .data(this.linkSearch)
          .enter()
          .append("line")
          .attr("stroke-width", function(d) {  return 3 })
          .join("path")
          .attr("marker-end", "url(#posMarker)")


      let linksName = graph.append("g") // g用于绘制所有关系
          .attr("class", "linkTexts")
          .selectAll("text")
          .data(this.linkSearch)
          .join("text")
          .style('text-anchor','middle')
          // .style('fill', '#020b51')
          .style('fill', d =>{
            // return this.nodeColors[2];
            let temp_label = null
            let node1 = this.nodes.filter(node => {
              if (node.id === d.source) return node
            })

            if(node1.length === 1)  temp_label = node1[0].label
            else temp_label = d.source.label

            for (let i = 0;i < this.labels.length;i++)
              if (temp_label === this.labels[i])
                return this.nodeColors[i]
          })
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d =>{return d.type})

      let node = graph.append("g") // 用于绘制所有的点
          .attr("class", "nodes")
          .selectAll("circle")
          .data(this.nodeSearch)
          .enter()
          .append("circle")
          .attr("r", function(d) {
            let size = 15
            for(let i = 0; i < _this.labels.length; i++)
              if(d.label === _this.labels[i])
                size = size + i * 4;

            return size * 2
          })
          .attr("fill", d => {
            for (let i = 0;i < this.labels.length;i++)
              if (d.label === this.labels[i])
                return this.nodeColors[i]
          })
          .attr("stroke", "none")
          .attr("name", d => d.properties.name)
          .attr("id", d => d.id)
          .attr("label", d => d.label)
          .call(this.drag(simulation))
          .on("click", nodeClick)


      let text = graph.append("g") // 显示所有的文本
          .attr("class", "texts")
          .selectAll("text")
          .data(this.nodeSearch)
          .enter()
          .append("text").attr("font-size", () => 14) // 设置大小、填充颜色、名字、text()设置文本
          .attr("fill", () => '#fff')
          .attr('name', d => d.properties.name)
          .attr('label', d => d.label)
          .attr("id", d => d.id)
          .attr("text-anchor", "middle") // 设置文本居中
          .attr('x', function (d) {
            return textBreaking(d3.select(this), d.properties.name)
          })
          .on('mouseenter', function (event) {
            const node = d3.select(this)
            let name = node.attr("name") //获取被选中元素的名字
            let label = node.attr("label") //获取被选中元素的名字
            let id = node.attr("id")
            let color = node.attr('fill')
            _this.selectNodeData = {}
            _this.$set(_this.selectNodeData, 'id', id) //设置#info h4样式的颜色为该节点的颜色，文本为该节点name
            _this.$set(_this.selectNodeData, 'label', label) //设置#info h4样式的颜色为该节点的颜色，文本为该节点name
            _this.$set(_this.selectNodeData, 'name', name)
            _this.$set(_this.selectNodeData, 'color', color)
            for (let item of _this.nodes)
              if (item.id.toString() === id)
                _this.$set(_this.selectNodeData, 'properties', item.properties)

            _this.changeGraphStyle(name) // 遍历节点，并调整图的样式
          })
          .on("click", nodeClick)
          .on('contextmenu', contextmenu(this.menu))

      node.append("title").text(d => d.properties.name)
      simulation.on("tick", ticked) // simulation中ticked数据初始化并生成图形
      simulation.force("link").links(this.linkSearch).distance(d => { // 每一边的长度
        let distance = 20
        switch(d.source.label) {
          case _this.labels[0]: distance += 30;break;
          case _this.labels[1]: distance += 25;break;
          case _this.labels[2]: distance += 22;break;
          default: distance += 20;break;
        }
        switch(d.target.label) {
          case _this.labels[0]: distance += 30;break;
          case _this.labels[1]: distance += 25;break;
          case _this.labels[2]: distance += 22;break;
          default: distance += 20;break;
        }
        return distance * 2
      })


      function contextmenu(menu,openCallback) {
        d3.selectAll('.d3-context-menu').data([1])
            .enter()
            .append('div')
            .attr('class', 'd3-context-menu')

        d3.select('body').on('click.d3-context-menu', function () {
          d3.select('.d3-context-menu').style('display', 'none')
        })

        return function (event, data) {
          console.log(event)
          let elm = this // 指向右键触发的节点

          d3.selectAll('.d3-context-menu').html('')
          let list = d3.selectAll('.d3-context-menu').append('ul')
          list.selectAll('li').data(menu).enter()
              .append('li')
              .html(function (d) {
                return d.title
              })
              .on('click', function (e, d) {
                d.action(elm, data)
                d3.select('.d3-context-menu').style('display', 'none')
              })

          if (openCallback) openCallback(data)

          d3.select('.d3-context-menu')
              .style('left', (event.pageX - 2) + 'px')
              .style('top', (event.pageY - 2) + 'px')
              .style('display', 'block')

          event.preventDefault()
        }
      } // 生成d3菜单

      function ticked() { // 文本通过translate平移变化
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)

        linksName
            .attr('transform', d => {
              let x = Math.min(d.source.x, d.target.x) + Math.abs(d.source.x - d.target.x) / 2
              let y = Math.min(d.source.y, d.target.y) + Math.abs(d.source.y - d.target.y) / 2 - 1
              // tanA = a / b
              // A = arctan(tanA)
              let tanA = Math.abs(d.source.y - d.target.y) / Math.abs(d.source.x - d.target.x)
              let angle = Math.atan(tanA) / Math.PI * 180
              // let angle = Math.atan2(1,1)/Math.PI*180

              if (d.source.x > d.target.x) { // 第一、二象限额外处理
                if (d.source.y <= d.target.y) { // 第二象限
                  angle = -angle
                }
                // else {  // 第三象限
                //   angle = angle
                // }
              } else if (d.source.y > d.target.y) { // 第一象限
                angle = -angle
              }
              return 'translate(' + x + ',' + y + ')' + 'rotate(' + angle + ')'
            })

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)

        text.attr('transform', function(d) {
          let size = 15
          switch(d.label){
            case _this.labels[0]: break;
            case _this.labels[1]: size = 14;break;
            case _this.labels[2]: size = 13;break;
            default: size = 12;break;
          }
          size -= 5
          return 'translate(' + (d.x - size / 2 + 3) + ',' + (d.y + size / 2) + ')'
        })
      } // ticked()函数确定link线的起始点x、y坐标 node确定中心点

      function textBreaking(d3text, text) { // d3text:文本对应的DOM对象;text:节点名称的文本值
        const len = text.length
        if (len <= 4) {
          d3text.append('tspan')
              .attr('x', 0)
              .attr('y', 2)
              .text(text)
        } else {
          const topText = text.substring(0, 4)
          const midText = text.substring(4, 8)
          let botText = text.substring(8, len)
          let topY = -16
          let midY = 0
          let botY = 16
          if (len <= 7) {
            topY += 10
            midY += 10
          } else if (len > 10){
            botText = text.substring(8, 10) + '...'
          }
          d3text.text('')
          d3text.append('tspan')
              .attr('x', 0)
              .attr('y', topY)
              .text(function () {
                return topText
              })
          d3text.append('tspan')
              .attr('x', 0)
              .attr('y', midY)
              .text(function () {
                return midText
              })
          d3text.append('tspan')
              .attr('x', 0)
              .attr('y', botY)
              .text(function () {
                return botText
              })
        }
      } //文本分隔（根据字数在当前选择器中分隔三行，超过10个字省略）

      function nodeClick(event, d) { // 由于点击前必定触发mouseenter事件，所以不用再去查找节点id
        event.cancelBubble = true
        event.stopPropagation() // 阻止事件冒泡

        const name = _this.selectNodeData.name // 直接通过this.selectNodeData拿到节点信息
        _this.isNodeClicked = true
        _this.changeGraphStyle(name)

        return false
      } // 分别定义节点(和文本)的点击事件
    },
    addMarkers() { // 绘制关系箭头
      let defs = this.Graph.append("defs") // 定义箭头的标识
      const posMarker = defs.append("marker")
          .attr("id", "posMarker")
          .attr("orient", "auto")
          .attr("stroke-width", 1.5)
          .attr("markerUnits", "strokeWidth")
          .attr("markerUnits", "userSpaceOnUse")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 30)
          .attr("refY", 0)
          .attr("markerWidth", 14)
          .attr("markerHeight", 14)
          .append("path")
          .attr("d", "M 0 -5 L 10 0 L 0 5")
          .attr('fill', '#e0cac1')
          .attr("stroke-opacity", 0.6);
      const posActMarker = defs.append("marker")
          .attr("id", "posActMarker")
          .attr("orient", "auto")
          .attr("stroke-width", 2)
          .attr("markerUnits", "strokeWidth")
          .attr("markerUnits", "userSpaceOnUse")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 31)
          .attr("refY", 0)
          .attr("markerWidth", 12)
          .attr("markerHeight", 12)
          .append("path")
          .attr("d", "M 0 -5 L 10 0 L 0 5")
          .attr('fill', '#020d79')
          .attr("stroke-opacity", 0.6);
      // const negMarker = defs.append("marker")
      //   .attr("id","negMarker")
      //   .attr("orient","auto")
      //   .attr("stroke-width",2)
      //   .attr("markerUnits", "strokeWidth")
      //   .attr("markerUnits", "userSpaceOnUse")
      //   .attr("viewBox", "0 -5 10 10")
      //   .attr("refX", -25)
      //   .attr("refY", 0)
      //   .attr("markerWidth", 12)
      //   .attr("markerHeight", 12)
      //   .append("path")
      //   .attr("d", "M 10 -5 L 0 0 L 10 5")
      //   .attr('fill', '#999')
      //   .attr("stroke-opacity", 0.6);
    },
    clearGraphStyle () { // 移除所有样式
      this.Graph.select('.nodes').selectAll('circle').attr('class', '')
      this.Graph.select(".texts").selectAll('text').attr('class', '')
      this.Graph.select('.links').selectAll('line').attr('class', '').attr('marker-end', 'url(#posMarker)')
      this.Graph.select(".linkTexts").selectAll('text').attr('class', '')
      // d3.select(this).attr('class', '')
    },
    changeGraphStyle (name) {
      let sourceNode = null
      let targetNode = null

      this.Graph.select('.nodes').selectAll('circle').attr('class', d => {
        if(d.properties.name === name) {
          return 'fixed'
        }
        else {
          for (let i = 0; i < this.links.length; i++) {
            if (typeof this.links[i]['source']  === 'object'){
              sourceNode = this.links[i]['source']
              targetNode = this.links[i]['target']
            }else{
              for (let item of this.nodes){
                if(this.links[i]['source'] === item.id) sourceNode = item
                if(this.links[i]['target'] === item.id) targetNode = item
              }
            }

            if (sourceNode.properties.name === name && targetNode.id === d.id) return 'active'
            if (targetNode.properties.name === name && sourceNode.id === d.id) return 'active'
          }
          return this.isNodeClicked ? 'inactive' : ''
        }
      })
      this.Graph.select('.texts').selectAll('text')
          .attr('class', d => {
            if(d.properties.name === name) {
              return ''
            }
            else {
              for (let i = 0; i < this.links.length; i++) {
                if (typeof this.links[i]['source']  === 'object'){
                  sourceNode = this.links[i]['source']
                  targetNode = this.links[i]['target']
                }else{
                  for (let item of this.nodes){
                    if(this.links[i]['source'] === item.id) sourceNode = item
                    if(this.links[i]['target'] === item.id) targetNode = item
                  }
                }

                if (sourceNode.properties.name === name && targetNode.id === d.id) return ''
                if (targetNode.properties.name === name && sourceNode.id === d.id) return ''
              }
              return this.isNodeClicked ? 'inactive' : ''
            }
          })

      this.Graph.select(".links").selectAll('line')
          .attr('class', d => {
            if (d.source.properties.name === name || d.target.properties.name === name) {
              return 'active'
            } else {
              return this.isNodeClicked ? 'inactive' : ''
            }
          })
          .attr('marker-end', d => {
            if (d.source.properties.name === name || d.target.properties.name === name) {
              return 'url(#posActMarker)'
            } else {
              return 'url(#posMarker)'
            }
          })

      this.Graph.select(".linkTexts").selectAll('text')
          .attr('class', d => {
            if (d.source.properties.name === name || d.target.properties.name === name) {
              return 'active'
            } else {
              return this.isNodeClicked ? 'inactive' : ''
            }
          })
    },
    drag(simulation) {
      function dragSubject(event) {
        return simulation.find(event.x, event.y);
      }
      function dragStarted(event) {
        if (!event.active)
          simulation.alphaTarget(0.1).restart(); // 设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0, 1]
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragEnded(event) {
        if (!event.active)
          simulation.alphaTarget(0);
        // 注释以下代码，使拖动结束后固定节点
        // event.subject.fx = null;
        // event.subject.fy = null;
      }

      return d3.drag()
          .subject(dragSubject)
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
    },
    changeTextState (state) { // 隐藏文字
      if (this.textState !== state) { // state发生变化时才进行更新、处理
        this.textState = state
        // const text = d3.selectAll('.texts text') //隐藏节点内的文字
        const text = d3.selectAll('.linkTexts text') //隐藏关系链上的文字
        console.log(text)
        if (this.textState === 2) { // 根据新的节点状态，在节点上展示不同的文本信息
          text.style('display', 'none')
        } else {
          text.style('display', 'block')
        }
      }
    },
  }
}
</script>

<style lang="scss">
$opacity: 0.15;  /* 显示的不透明度 */
$activeColor: #020d79;  /* 激活的颜色 */

.d3-context-menu {
  position: absolute;
  display: none;
  background-color: #f2f2f2;
  border-radius: 4px;

  font-family: Arial, sans-serif;
  font-size: 14px;
  min-width: 150px;
  border: 1px solid #d4d4d4;

  z-index:1200;
}

.d3-context-menu ul {
  list-style-type: none;
  margin: 4px 0px;
  padding: 0px;
  cursor: default;
}

.d3-context-menu ul li {
  padding: 4px 16px;
}

.d3-context-menu ul li:hover {
  background-color: #4677f8;
  color: #fefefe;
}

graph {
  margin: 20px 0px;
  //border: 1px #000 solid;
  overflow: hidden;
}

.links line { /*设置节点及边的样式*/
  stroke: #e0cac1b2;
  stroke-opacity: 1;
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 3px;
  }
  &.hide {
    display: none !important;
  }
}

.nodes circle {
  // stroke: #000;
  // stroke-width: 1.5px;
  &.fixed {
    // fill: rgb(102, 81, 81);
    stroke: #FFC0CB;  // #888;
    stroke-width: 14px;
    stroke-opacity: $opacity + 0.3;
    border: 10px #000 solid;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
  &.active {
    stroke: $activeColor;
    stroke-width: 4px;
  }
  &:hover {
    cursor: pointer;
  }
  &.hide {
    display: none !important;
  }
}

.texts text {
  cursor: pointer;
  text-decoration: none;
  user-select: none;
  &:hover {
    cursor: pointer;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}

.linkTexts text {
  //stroke: rgba(181, 56, 209, 0.69); // #bbb
  stroke-opacity: 0.05;
  &.active {
    stroke: $activeColor;
  }
  &.inactive {
    /* display: none !important; */
    opacity: $opacity;
  }
}

</style>

<style lang="scss" scoped>
@media only screen and (max-width: 1125px){
  #info, #mode {
    display: none !important;
  }
}

.font-sky {
  position: absolute;
  top: 35px;
  font-size: 16px;
  color: #020d79 !important;
  font-family: "HeFeng";
}

#indicator {
  position: absolute;
  left: 50px;
  bottom: 30px;
  text-align: left;
  color: #0b0c2e;
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

#mode { /*mode选项样式*/
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  top: 60px;
  left:50px;
  .gState span {
    display: inline-block;
    border: 1px solid #fff;
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    transition: color, background-color .3s;
    -o-transition: color, background-color .3s;
    -ms-transition: color, background-color .3s;
    -moz-transition: color, background-color .3s;
    -webkit-transition: color, background-color .3s;
    ~ .active, ~ :hover {
      background-color: #fff;
      color: #333;
      cursor: pointer;
    }
  }
  .gState span.active, .gState span:hover {
    background-color: #fff;
    color: #333;
    cursor: pointer;
  }
}

#info { /*悬浮节点的info样式*/
  font-size: 16px;
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 270px;
  .node-card {
    border: 1px solid #9faecf;
    background-color: #0b0c2e;
    color: #fff;
    text-align: left;
    // transition: background-color;
    // transition-delay: .3s;
    // transition-timing-function: ease;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}
</style>