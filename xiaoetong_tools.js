// ==UserScript==
// @name         小鹅通工具
// @namespace    http://bestmind.space
// @version      2.3
// @description  小鹅通工具
// @author       xiaoweicheng
// @downloadURL  https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/xiaoetong_tools.js
// @updateURL    https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/xiaoetong_tools.js
// @match        https://admin.xiaoe-tech.com/t/*
// @icon         https://commonresource-1252524126.cdn.xiaoeknow.com/image/lhyaurs50zil.ico
// @grant        none
// @require      https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// ==/UserScript==

let toolPanel
let toolTableBody
const authTypeFree = 0
const authTypePassword = 1
const authTypeUnknown = -1
let selected = new Set()
let checkBoxes = []
let appId
let password
let expiredDate
let page
let pageSize
let total
let prePage
let nextPage
let tagIds = new Set()
let tagSelectCount
let saleType = 0
let resourceType = 1
let resourceTypes = [1, 2, 3]
let resourceTypeMap = {
    1: {
        name: '图文',
        contentUrl: '/xe.course.b_admin_r.image_text.detail.get/1.0.0',
        updateUrl: '/xe.course.b_admin_w.image_text.update/1.0.0'
    }, 2: {
        name: '音频',
        contentUrl: '/xe.course.b_admin_r.audio.info.get/1.0.0',
        updateUrl: '/xe.course.b_admin_w.audio.update/1.0.0'
    }, 3: {
        name: '视频',
        contentUrl: '/xe.course.b_admin_r.video.info.get/1.0.0',
        updateUrl: '/xe.course.b_admin_w.video.update/1.0.0'
    }
}

let tool = document.createElement('button')
tool.innerHTML = '小鹅通<br>小工具'
tool.style = 'position:fixed; top:200px; right:10px; z-index:1000001'
tool.onclick = () => {
    if (!toolPanel) {
        initPanel()
    } else {
        document.body.removeChild(toolPanel)
        toolPanel = undefined
    }
}
document.body.appendChild(tool)

function initPanel() {
    toolPanel = document.createElement('div')
    toolPanel.style = 'position:fixed; height:90%; top:5%; right:50px; z-index:1000000; background:rgba(233,233,233,1);'
    document.body.appendChild(toolPanel)
    let checkOption = document.createElement('div')
    toolPanel.appendChild(checkOption)
    let modifyOption = document.createElement('div')
    toolPanel.appendChild(modifyOption)
    let searchOption = document.createElement('div')
    toolPanel.appendChild(searchOption)
    let tagLine = document.createElement('div')
    toolPanel.appendChild(tagLine)
    let pageOption = document.createElement('div')
    toolPanel.appendChild(pageOption)
    let tableLine = document.createElement('div')
    toolPanel.appendChild(tableLine)
    initCheckOption(checkOption)
    initModifyOption(modifyOption)
    initSearchOption(searchOption, tagLine, [pageOption, tableLine])
    initTagLine(tagLine)
    initPageOption(pageOption)
    initTable(tableLine)
}

function initCheckOption(line) {
    let checkAll = document.createElement('button')
    line.appendChild(checkAll)
    setStyle(checkAll)
    addSpan(checkAll, '全选')
    checkAll.onclick = function () {
        checkBoxes.forEach(cb => {
            if (!cb.checkBox.checked) {
                cb.row.click()
            }
        })
    }

    let checkFree = document.createElement('button')
    line.appendChild(checkFree)
    setStyle(checkFree)
    addSpan(checkFree, '全选免费')
    checkFree.onclick = function () {
        checkBoxes.forEach(cb => {
            if (!cb.checkBox.checked && cb.authType === authTypeFree) {
                cb.row.click()
            }
        })
    }

    let checkNone = document.createElement('button')
    line.appendChild(checkNone)
    setStyle(checkNone)
    addSpan(checkNone, '取消全选')
    checkNone.onclick = function () {
        checkBoxes.forEach(cb => {
            if (cb.checkBox.checked) {
                cb.row.click()
            }
        })
    }
}

function initModifyOption(line) {
    let saleTypeSelect = document.createElement('select')
    line.appendChild(saleTypeSelect)
    saleTypeSelect.style.width = 'auto'

    let saleType2Span = document.createElement('span')
    line.appendChild(saleType2Span)
    saleType2Span.style.display = 'none'

    let passwordSpan = document.createElement('span')
    saleType2Span.appendChild(passwordSpan)
    setStyle(passwordSpan)
    addSpan(passwordSpan, '密码')
    password = document.createElement('input')
    passwordSpan.appendChild(password)
    password.size = 15

    let expiredDateSpan = document.createElement('span')
    saleType2Span.appendChild(expiredDateSpan)
    setStyle(expiredDateSpan)
    addSpan(expiredDateSpan, '过期日期')
    expiredDate = document.createElement('input')
    expiredDateSpan.appendChild(expiredDate)
    expiredDate.type = 'date'

    let saleTypes = [0, 2]
    let saleTypeMap = {
        0: {
            name: '免费', choose: function () {
            }, cancel: function () {
            }, check: function () {
                return true
            }
        }, 2: {
            name: '加密', choose: function () {
                saleType2Span.style.display = 'inline'
            }, cancel: function () {
                saleType2Span.style.display = 'none'
            }, check: function () {
                if (password.value.trim() === '' || expiredDate.value === '') {
                    alert("请输入正确的密码与过期时间")
                    return false
                }
                return true
            }
        }
    }

    saleTypeSelect.onchange = () => {
        let selected = saleTypeSelect.options[saleTypeSelect.selectedIndex]
        saleTypeMap[saleType].cancel()
        saleType = Number.parseInt(selected.value)
        saleTypeMap[saleType].choose()
    }

    saleTypes.forEach((st) => {
        let op = document.createElement('option')
        saleTypeSelect.appendChild(op)
        op.value = st.toString()
        addSpan(op, saleTypeMap[st].name)
        op.selected = st === saleType
    })

    let modify = document.createElement('button')
    line.appendChild(modify)
    setStyle(modify)
    addSpan(modify, '修改')
    modify.onclick = () => {
        if (!saleTypeMap[saleType].check()) {
            return
        }
        if (selected.size === 0) {
            alert("请选择要修改的课程")
            return
        }
        batchModify()
    }
}

function initSearchOption(line, tagLine, lines) {
    let resourceTypeSelect = document.createElement('select')
    line.appendChild(resourceTypeSelect)
    resourceTypeSelect.style.width = 'auto'
    resourceTypeSelect.onchange = () => {
        let selected = resourceTypeSelect.options[resourceTypeSelect.selectedIndex]
        resourceType = Number.parseInt(selected.value)
    }
    resourceTypes.forEach((st) => {
        let op = document.createElement('option')
        resourceTypeSelect.appendChild(op)
        op.value = st.toString()
        addSpan(op, resourceTypeMap[st].name)
        op.selected = st === saleType
    })

    let tagButton = document.createElement('button')
    line.appendChild(tagButton)
    setStyle(tagButton)
    addSpan(tagButton, '商品分组已选')
    tagSelectCount = addSpan(tagButton, '0')

    let search = document.createElement('button')
    line.appendChild(search)
    setStyle(search)
    addSpan(search, '筛选')

    tagButton.onclick = () => {
        if (tagLine.style.display === 'none') {
            lines.forEach(one => {
                one.style.display = 'none'
            })
            tagLine.style.display = 'block'
        } else {
            tagLine.style.display = 'none'
            lines.forEach(one => {
                one.style.display = 'block'
            })
        }
    }

    search.onclick = () => {
        tagLine.style.display = 'none'
        lines.forEach(one => {
            one.style.display = 'block'
        })
        resetPageOption()
        loadTable()
    }
}

function initTagLine(line) {
    line.style.display = 'none'
    line.style.height = '100%'
    let tagTable = document.createElement('table')
    line.appendChild(tagTable)
    setStyle(tagTable)
    tagTable.style.height = '80%'
    let tagSelector = document.createElement('tbody')
    tagTable.appendChild(tagSelector)
    tagSelector.style.display = 'block'
    tagSelector.style.height = '100%'
    tagSelector.style.overflowY = 'scroll'

    initTags(1, tagSelector)
    return line;
}

function initTags(page, selector) {
    $.ajax({
        type: 'POST',
        url: "/xe.ecommerce.resource_tag_go.tag.list/1.0.0",
        cache: false,
        contentType: "application/json",
        data: JSON.stringify({
            page: page, page_size: 50, tag_name: ''
        }),
        success: function (data) {
            let tagTotal = data.data.total
            addTagOptions(data.data.list, selector)
            if (page * 50 < tagTotal) {
                initTags(page + 1, selector)
            }
        }
    })
}

function addTagOptions(tags, selector) {
    tags.forEach(tag => {
        addTagOption(tag, selector)
    })
}

function addTagOption(tag, selector) {
    let row = document.createElement('tr');
    selector.appendChild(row)
    setStyle(row)
    row.style.display = 'table'
    let cb = document.createElement('input');
    row.appendChild(cb)
    cb.type = 'checkbox'
    cb.style.pointerEvents = "none"
    addSpan(row, tag.tag_name)
    row.onclick = () => {
        let tagId = tag.tag_id;
        if (tagIds.has(tagId)) {
            tagIds.delete(tagId)
            cb.checked = false
        } else {
            tagIds.add(tagId)
            cb.checked = true
        }
        tagSelectCount.innerText = tagIds.size
        console.log("已选分组: " + Array.from(tagIds))
    }
}

function initPageOption(line) {
    let totalSpan = document.createElement('span');
    line.appendChild(totalSpan)
    setStyle(totalSpan)
    addSpan(totalSpan, '共')
    total = addSpan(totalSpan, '0')
    addSpan(totalSpan, '条')


    let pageSizeSpan = document.createElement('span');
    line.appendChild(pageSizeSpan)
    setStyle(pageSizeSpan)
    addSpan(pageSizeSpan, '每页')
    pageSize = document.createElement('input');
    pageSizeSpan.appendChild(pageSize)
    pageSize.type = 'number'
    pageSize.min = '10'
    pageSize.max = '50'
    pageSize.step = '5'
    pageSize.value = '15'
    pageSize.size = 2
    addSpan(pageSizeSpan, '条')

    let pageSpan = document.createElement('span');
    line.appendChild(pageSpan)
    setStyle(pageSpan)
    addSpan(pageSpan, '第')
    page = addSpan(pageSpan, '1')
    addSpan(pageSpan, '页')

    prePage = document.createElement('button')
    line.appendChild(prePage)
    setStyle(prePage)
    addSpan(prePage, '上一页')
    prePage.onclick = function () {
        if (Number.parseInt(page.innerText) > 1) {
            page.innerText = Number.parseInt(page.innerText) - 1
            prePage.style.display = 'none'
            nextPage.style.display = 'none'
            loadTable()
        }
    }

    nextPage = document.createElement('button')
    line.appendChild(nextPage)
    setStyle(nextPage)
    addSpan(nextPage, '下一页')
    nextPage.onclick = function () {
        if (Number.parseInt(page.innerText) < Math.ceil(Number.parseInt(total.innerText) / Number.parseInt(pageSize.value))) {
            page.innerText = Number.parseInt(page.innerText) + 1
            prePage.style.display = 'none'
            nextPage.style.display = 'none'
            loadTable()
        }
    }

    resetPageOption()
}

function resetPageOption() {
    total.innerText = '0'
    page.innerText = '1'
    prePage.style.display = 'none'
    nextPage.style.display = 'none'
}

function initTable(line) {
    line.style.height = '100%'
    let toolTable = document.createElement('table')
    line.appendChild(toolTable)
    setStyle(toolTable)
    toolTable.style.height = '75%'
    toolTableBody = document.createElement('tbody')
    toolTable.appendChild(toolTableBody)
    toolTableBody.style.display = 'block'
    toolTableBody.style.height = '100%'
    toolTableBody.style.overflowY = 'scroll'
    loadTable()
}

function loadTable() {
    selected.clear()
    checkBoxes = []
    toolTableBody.innerText = ''
    $.get('/xe.material-center.material.summary/1.0.0', function (data, status) {
        if (status !== 'success') {
            alert("获取appId失败 status=" + status)
            return
        }
        appId = data.data.app_id
        $.post("/xe.course.b_admin_r.course.base.list/1.0.0", {
            app_id: appId,
            page_index: Number.parseInt(page.innerText),
            page_size: Number.parseInt(pageSize.value),
            resource_type: resourceType,
            sale_status: -1,
            auth_type: -1,
            search_content: '',
            tags: Array.from(tagIds)
        }, function (data, status) {
            if (status !== 'success') {
                alert("获取课程列表失败 status=" + status)
                return
            }
            setPageContext(data.data.total)
            displayCourses(data.data.list)
        }, 'json')
    }, 'json')
}

function setPageContext(newTotal) {
    total.innerText = newTotal
    let totalPage = Math.ceil(newTotal / Number.parseInt(pageSize.value))
    let currPage = Number.parseInt(page.innerText)
    prePage.style.display = currPage > 1 ? 'inline' : 'none'
    nextPage.style.display = currPage < totalPage ? 'inline' : 'none'
}

function displayCourses(courses) {
    courses.forEach(course => {
        let authType = getAuthType(course);
        if (authType === authTypePassword) {
            displayCourseForPassword(authType, course)
        } else {
            displayCourse(authType, course)
        }
    })
}

function displayCourseForPassword(authType, course) {
    $.get("/xe.course.b_admin_r.goods.info.get/1.0.0", {
        resource_id: course.resource_id,
    }, function (data, status) {
        if (status !== 'success') {
            alert("获取课程列表失败 status=" + status)
            return
        }
        course.sell_data = data.data.sell_data
        displayCourse(authType, course)
    }, 'json')
}

function displayCourse(authType, course) {
    let row = document.createElement('tr')
    toolTableBody.appendChild(row)
    setStyle(row)
    row.style.display = 'table'
    let cb = document.createElement('input')
    row.appendChild(cb)
    cb.type = 'checkbox'
    cb.style.pointerEvents = "none"
    fulfillRow(row, authType, course)
    checkBoxes.push({authType: authType, checkBox: cb, row: row})
    row.onclick = () => {
        let courseId = course.resource_id;
        if (selected.has(courseId)) {
            selected.delete(courseId)
            cb.checked = false
        } else {
            selected.add(courseId)
            cb.checked = true
        }
        console.log("已选资源: " + Array.from(selected))
    }
}

function fulfillRow(row, authType, course) {
    switch (authType) {
        case authTypeFree:
            addSpan(row, '[免费]')
            break
        case authTypePassword:
            addSpan(row, '[加密|')
            addSpan(row, course.sell_data.password , true)
            let period = course.period;
            addSpan(row, '|' + (period.period_type === 1 ? period.period_value : '未知到期时间') + ']')
            break
        default:
            addSpan(row, '[未知]')
    }
    addSpan(row, course.title)
}

function getAuthType(course) {
    return course.is_free ? course.is_password ? authTypePassword : authTypeFree : authTypeUnknown
}

let builders = [function (context, resolve, reject) {
    $.get(resourceTypeMap[resourceType].contentUrl, {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取content失败 status=" + status)
            reject()
            return
        }
        context.content = data.data
        resolve()
    }, 'json')
}, function (context, resolve, reject) {
    $.get("/xe.course.b_admin_r.resource.detail.get/1.0.0", {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取course失败 status=" + status)
            reject()
            return
        }
        context.course = data.data
        resolve()
    }, 'json')
}, function (context, resolve, reject) {
    $.get("/xe.course.b_admin_r.goods.info.get/1.0.0", {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取goods失败 status=" + status)
            reject()
            return
        }
        context.goods = data.data
        resolve()
    }, 'json')
}, function (context, resolve, reject) {
    $.get("/xe.course.b_admin_r.wuxiaobo_app.get/1.0.0", {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取app失败 status=" + status)
            reject()
            return
        }
        context.app = data.data
        resolve()
    }, 'json')
}, function (context, resolve, reject) {
    $.get("/xe.course.b_admin_r.resource_desc.get/1.0.0", {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取ios失败 status=" + status)
            reject()
            return
        }
        context.ios = data.data.resource_desc
        resolve()
    }, 'json')
}]

function batchModify() {
    let promiseArr = []
    selected.forEach(id => {
        promiseArr.push(new Promise((resolve) => {
            doModify(id, resolve)
        }))
    })
    Promise.all(promiseArr).then(() => {
        loadTable()
    })
}

let sellDataFulfill = {
    0: function (sellData) {
        sellData.period_type = 0
        sellData.limitPurchaseType = null
        sellData.password = null
        sellData.period_value = ''
    }, 2: function (sellData) {
        sellData.is_single_sale = true
        sellData.period_type = 1
        sellData.limitPurchaseType = 2
        sellData.password = password.value
        sellData.period_value = (expiredDate.value + ' 00:00:00')
    }
}

function doModify(id, resolve) {
    let context = {
        resource_id: id, scene: '1001', library_list: [], relation: {
            package_id_after: [], package_id_before: []
        }
    }
    let promiseArr = []
    builders.forEach(builder => {
        promiseArr.push(new Promise((resolve, reject) => {
            builder(context, resolve, reject)
        }))
    })
    Promise.all(promiseArr).then(() => {
        let sellData = context.goods.sell_data
        sellData.is_single_sale = true
        sellData.sale_type = saleType
        sellDataFulfill[saleType](sellData)
        $.ajax({
            type: 'POST',
            url: resourceTypeMap[resourceType].updateUrl,
            cache: false,
            contentType: "application/json",
            data: JSON.stringify(context),
            success: function (data) {
                resolve()
            }
        })
    }, () => {
        resolve()
    })
}

function setStyle(t) {
    t.style.margin = '5px'
}

function addSpan(p, text, highlight = false) {
    let span = document.createElement('span');
    p.appendChild(span)
    span.innerText = text
    if( highlight){
        span.style.color = 'red'
    }
    return span
}
