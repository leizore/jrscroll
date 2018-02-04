# jrscroll
下拉刷新，上拉加载 的基础款（基本实现）
## 用法 ##

```html
<div class="jrscroll"> 
//列表内容,如:<ul>列表数据</ul> ..
</div>
<script>
    var scroll = new JrRefresh(scrollWrap, {
        downCallback: pullDownRefresh,
        upCallback: pullUpLoadMore
    })
    function pullDownRefresh() {
        setTimeout(() => {
            console.log('刷新成功')
            // 处理数据
            scroll.endSuccess(true)
        }, 1000)
    }
    function pullUpLoadMore() {
        setTimeout(() => {
            console.log('请求成功')
            // 处理数据
            scroll.endSuccess(true)
        }, 2000)
    
    }
</script>
```