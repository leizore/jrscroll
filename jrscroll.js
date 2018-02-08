var defaults = {
    threshold: 100,   // 滑动触发下拉刷新的距离
    stop: 40,         // 下拉刷新时停留的位置距离屏幕顶部的距离
    dis: 50           // 距离屏幕底端触发 上拉加载 的距离
}
function JrRefresh (el, options) {
    this.options = Object.assign({}, defaults, options)  // 合并参数
    this.el = typeof el === 'string' ? document.querySelector(el) : el  // 定义要操作对象
    this.progress = null       // 下拉刷新显示的 dom
    this.loadMore = null       // 上拉加载显示的 dom
    this.progressHeight = 0    // 下拉刷新的 dom 的高度
    this.rotate = null         // 下拉刷新 转圈 的角度
    this.touchstartY = 0       // 触摸到屏幕的坐标起始 Y 值
    this.currentY = 0          // 移动时实时记录的坐标 Y 值
    this.isAnimation = false   // 是否在自动回滚
    this.isRefresh = false     // 是否正在刷新数据
    this.isLoadMore = false    // 是否正在加载数据
    this.hasMore = true        // 是否有更多数据
    this.rotateTimer = null    // 控制 下拉刷新 转圈 的时间计时器
    this.event()
    this.init()
}
JrRefresh.prototype.init = function () {
    // 增加下拉刷新的显示
    var refreshHtml = `<div class="jrscroll-downwarp jrscroll-downwarp-reset" style="height: 0px;"><div class="downwarp-content"><p class="downwarp-progress" style="transform: rotate(0deg);"></p ><p class="downwarp-tip">下拉刷新</p ></div></div>`
    var divm = document.createElement('div')
    divm.innerHTML = refreshHtml
    this.progress = divm.children[0]
    this.el.prepend(this.progress)
    // 增加上拉加载的显示
    var loadMoreHtml = `<div class="jrscroll-upwarp" style="visibility: hidden;"><p class="upwarp-progress"></p><p class="upwarp-tip">加载中...</p></div>`
    var div = document.createElement('div')
    div.innerHTML = loadMoreHtml
    this.loadMore = div.children[0]
    this.el.appendChild(this.loadMore)
}

JrRefresh.prototype.event = function () {
    this.el.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.el.addEventListener('touchmove', this.pullDown.bind(this))
    this.el.addEventListener('touchend', this.touchend.bind(this))
    window.addEventListener('scroll', this.handleScroll.bind(this))
}
JrRefresh.prototype.handleTouchStart = function (e) {
    // 记录手指触摸屏幕的 Y 值坐标
    this.touchstartY = e.changedTouches[0].clientY
}
JrRefresh.prototype.pullDown = function (e) {
    var scrollTop = document.documentElement.scrollTop ||
                    window.pageYOffset ||
                    document.body.scrollTop
    this.currentY = e.targetTouches[0].clientY
    if (this.currentY - this.touchstartY >= 0 && scrollTop <= 0) {
        e.preventDefault()
        if (!this.isAnimation && !this.isRefresh) {
            this.moveDown(this.currentY - this.touchstartY)
        }
    }
}
JrRefresh.prototype.moveDown = function (dis) {
    if (dis < this.options.threshold) {
        this.progress.style.height = this.progressHeight + dis + 'px'
        this.rotateProgress(dis*2)
        this.changeProgressState('下拉刷新')
    } else {
        // 当滑动距离超过 threshold 时，放慢下拉速度
        var aftDis = this.options.threshold + (dis - this.options.threshold) / 3
        var aftAngle = this.options.threshold * 2 + (dis - this.options.threshold) / 1.7
        this.progress.style.height = this.progressHeight + aftDis + 'px'
        this.rotateProgress(aftAngle)
        this.changeProgressState('释放刷新')
    }
}
JrRefresh.prototype.rotateProgress = function (rotate) {
    var rotateDom = this.progress.querySelector('.downwarp-progress')
    if (rotate != undefined) {
        rotateDom.style.transform = 'rotate(' + rotate + 'deg)'
        this.rotate = rotate
    } else {
        var t = 0;
        this.rotateTimer = setInterval(() => {
            t++
            var angle = (this.rotate + t*15) % 360
            rotateDom.style.transform = 'rotate(' + angle + 'deg)'
            rotateDom.style.WebkitTransform = 'rotate(' + angle + 'deg)'
        }, 16)
    }
}
JrRefresh.prototype.changeProgressState = function (name) {
    this.progress.querySelector('.downwarp-tip').innerHTML = name
}
JrRefresh.prototype.touchend = function () {
    var scrollTop = document.documentElement.scrollTop ||
                    window.pageYOffset ||
                    document.body.scrollTop
    if (scrollTop > 0 || this.isRefresh|| this.isAnimation) return     //只有在屏幕顶部才进行处理
    if ((this.currentY - this.touchstartY) > this.options.threshold) {
        this.options.downCallback()  // 触发参数穿过来的请求数据
        this.isRefresh = true
        console.log(this.options.stop)
        this.moveBack(this.options.stop)            // 下拉刷新时停留的位置距离屏幕顶部的距离
    } else  {
        console.log(0)
        this.moveBack()
    }
}
JrRefresh.prototype.moveBack = function (dis) {
    var dis = dis || 0;
    this.isAnimation = true   // 正在回退
    var currentHeight = this.progress.offsetHeight
    var t = 0,                        // 进行的步数
        b = 10,                       // 总步数
        c = (currentHeight - dis)/b   // 每一步的距离
    var timer = setInterval(() => {
        t++;
        this.progress.style.height = currentHeight - c * t + 'px'
        if (t == b) {
            if (dis === 0) {
                this.changeProgressState('下拉刷新')
                this.progressHeight = 0
            } else {
                this.changeProgressState('正在刷新')
                this.progressHeight = this.options.stop
                this.rotateProgress()
            }
            this.touchstartY = ''
            this.isAnimation = false     // 回退完成
            clearInterval(timer)
        }
    }, 16)
}
JrRefresh.prototype.endSuccess = function (bool) {
    if (this.isRefresh) {      //  如果是正在刷新数据
        this.changeProgressState('刷新成功')
        if (bool) {
            setTimeout(() => {     //延迟 500ms 回滚
                this.moveBack(0)
                this.isRefresh = false
                clearInterval(this.rotateTimer)
            },500)
        } else {
            this.toggleLoadingText(true)
        }
    }
    if (this.isLoadMore) {     //  如果是正在加载数据
        this.isLoadMore = false
        this.hasMore = bool
        this.loadMore.style.visibility = 'hidden'
        this.toggleLoadingText(bool)
    }
}
JrRefresh.prototype.toggleLoadingText = function (hasMore) {
    if (hasMore) {
        this.loadMore.querySelector('.upwarp-tip').innerHTML = '加载中...'
        this.loadMore.querySelector('.upwarp-progress').style.display = 'inline-block'
    } else {
        this.loadMore.style.visibility = 'visible'
        this.loadMore.querySelector('.upwarp-tip').innerHTML = '没有更多数据了'
        this.loadMore.querySelector('.upwarp-progress').style.display = 'none'
    }
}
JrRefresh.prototype.handleScroll = function () {
    var top = this.loadMore.getBoundingClientRect().top;    // 获取最底部标签距离屏幕顶部的距离
    if (top + 10 < window.innerHeight  < this.options.dis && !this.isLoadMore && this.hasMore) {
        this.isLoadMore = true
        this.loadMore.style.visibility = 'visible'
        this.options.upCallback()
    }
}
