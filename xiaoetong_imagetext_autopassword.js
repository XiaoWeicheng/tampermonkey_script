// ==UserScript==
// @name         小鹅通工具
// @namespace    http://bestmind.space
// @version      1.0
// @description  小鹅通工具
// @author       xiaoweicheng
// @downloadURL  https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/xiaoetong_tools.js
// @updateURL    https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/xiaoetong_tools.js
// @match        https://admin.xiaoe-tech.com/t/*
// @icon         https://commonresource-1252524126.cdn.xiaoeknow.com/image/lhyaurs50zil.ico
// @grant        none
// ==/UserScript==

let toolPanel
let toolTableBody
let selected = new Set()
let appId
let password
let expiredDate
let page
let pageSize
let total
let prePage
let nextPage

let tool = document.createElement('button')
tool.innerHTML = '小<br>工<br>具'
tool.style = 'position:fixed; top:200px; right:10px; z-index:1000001'
tool.onclick = toolClick
document.body.appendChild(tool)

function toolClick() {
    if (!toolPanel) {
        initPanel()
    } else {
        document.body.removeChild(toolPanel)
        toolPanel = undefined
    }
}

function initPanel() {
    toolPanel = document.createElement('div')
    toolPanel.style = 'position:fixed; height:90%; top:5%; right:50px; z-index:1000000; background:rgba(222,222,222,1);'
    document.body.appendChild(toolPanel)

    let line1 = document.createElement('div');
    toolPanel.appendChild(line1)

    let checkAll = document.createElement('button')
    line1.appendChild(checkAll)
    checkAll.innerText = '全选'
    setStyle(checkAll)
    checkAll.onclick = function () {
        toolTable.childNodes.forEach(tr => {
            if (!tr.firstChild.firstChild.checked) {
                tr.firstChild.firstChild.click()
            }
        })
    }

    let checkFree = document.createElement('button')
    line1.appendChild(checkFree)
    checkFree.innerText = '全选免费'
    setStyle(checkFree)
    checkFree.onclick = function () {
        toolTable.childNodes.forEach(tr => {
            if (!tr.firstChild.firstChild.checked && tr.childNodes[1].innerText === '免费') {
                tr.firstChild.firstChild.click()
            }
        })
    }

    let checkNone = document.createElement('button')
    line1.appendChild(checkNone)
    checkNone.innerText = '取消全选'
    setStyle(checkNone)
    checkNone.onclick = function () {
        toolTable.childNodes.forEach(tr => {
            if (tr.firstChild.firstChild.checked) {
                tr.firstChild.firstChild.click()
            }
        })
    }

    let line2 = document.createElement('div');
    toolPanel.appendChild(line2)

    let passwordSpan = document.createElement('span')
    line2.appendChild(passwordSpan)
    setStyle(passwordSpan)
    passwordSpan.innerText = '密码'
    password = document.createElement('input')
    passwordSpan.appendChild(password)
    password.size = 15

    let expiredDateSpan = document.createElement('span')
    line2.appendChild(expiredDateSpan)
    setStyle(expiredDateSpan)
    expiredDateSpan.innerText = '过期日期'
    expiredDate = document.createElement('input')
    expiredDateSpan.appendChild(expiredDate)
    expiredDate.type = 'date'

    let modify = document.createElement('button')
    line2.appendChild(modify)
    modify.innerText = '修改'
    setStyle(modify)
    modify.onclick = () => {
        if (password.value.trim() === '' || expiredDate.value === '') {
            alert("请输入正确的密码与过期时间")
            return
        }
        if (selected.size === 0) {
            alert("请选择要修改的课程")
        }
        batchModify()
    }

    let line3 = document.createElement('div');
    toolPanel.appendChild(line3)

    let totalSpan = document.createElement('span');
    line3.appendChild(totalSpan)
    setStyle(totalSpan)
    let totalSpan1 = document.createElement('span');
    totalSpan.appendChild(totalSpan1)
    totalSpan1.innerText = '共'
    total = document.createElement('span');
    totalSpan.appendChild(total)
    total.innerText = '0'
    let totalSpan2 = document.createElement('span');
    totalSpan.appendChild(totalSpan2)
    totalSpan2.innerText = '条'


    let pageSizeSpan = document.createElement('span');
    line3.appendChild(pageSizeSpan)
    setStyle(pageSizeSpan)
    let pageSizeSpan1 = document.createElement('span');
    pageSizeSpan.appendChild(pageSizeSpan1)
    pageSizeSpan1.innerText = '每页'
    pageSize = document.createElement('input');
    pageSizeSpan.appendChild(pageSize)
    pageSize.type = 'number'
    pageSize.min = '10'
    pageSize.max = '50'
    pageSize.step = '5'
    pageSize.value = '20'
    pageSize.size = 2
    let pageSizeSpan2 = document.createElement('span');
    pageSizeSpan.appendChild(pageSizeSpan2)
    pageSizeSpan2.innerText = '条'

    let pageSpan = document.createElement('span');
    line3.appendChild(pageSpan)
    setStyle(pageSpan)
    let pageSpan1 = document.createElement('span');
    pageSpan.appendChild(pageSpan1)
    pageSpan1.innerText = '第'
    page = document.createElement('span');
    pageSpan.appendChild(page)
    page.innerText = '1'
    let pageSpan2 = document.createElement('span');
    pageSpan.appendChild(pageSpan2)
    pageSpan2.innerText = '页'

    prePage = document.createElement('button')
    line3.appendChild(prePage)
    prePage.innerText = '上一页'
    prePage.style.display = 'none'
    setStyle(prePage)
    prePage.onclick = function () {
        if (Number.parseInt(page.innerText) > 1) {
            page.innerText = Number.parseInt(page.innerText) - 1
            loadTable()
        }
    }

    nextPage = document.createElement('button')
    line3.appendChild(nextPage)
    nextPage.innerText = '下一页'
    nextPage.style.display = 'none'
    setStyle(nextPage)
    nextPage.onclick = function () {
        if (Number.parseInt(page.innerText) < Number.parseInt(total.innerText) / Number.parseInt(pageSize.value) + 1) {
            page.innerText = Number.parseInt(page.innerText) + 1
            loadTable()
        }
    }

    initTable()
}

function initTable() {
    let toolTableWrap = document.createElement('div')
    toolPanel.appendChild(toolTableWrap)
    toolTableWrap.style.display = 'block'
    toolTableWrap.style.height = '90%'
    toolTableWrap.style.overflowY = 'auto'
    let toolTable = document.createElement('table')
    toolTableWrap.appendChild(toolTable)
    setTableStyle(toolTable)
    toolTableBody = document.createElement('tbody')
    toolTable.appendChild(toolTableBody)
    loadTable()
}

function loadTable() {
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
            resource_type: 1,
            sale_status: -1,
            auth_type: -1,
            search_content: ''
        }, function (data, status) {
            if (status !== 'success') {
                alert("获取课程列表失败 status=" + status)
                return
            }
            console.log(data)
            setPageContext(data.data.total)
            displayCourses(data.data.list)
        }, 'json')
    }, 'json')
}

function setPageContext(newTotal) {
    total.innerText = newTotal
    let totalPage = newTotal / Number.parseInt(pageSize.value) + 1
    let currPage = Number.parseInt(page.innerText)
    prePage.style.display = currPage > 1 ? 'inline' : 'none'
    nextPage.style.display = currPage < totalPage ? 'inline' : 'none'
}

function displayCourses(courses) {
    courses.forEach(course => {
        displayCourse(course, courses.length)
    })
}

function displayCourse(course, total) {
    let row = document.createElement('tr')
    let c1 = document.createElement('td')
    setTableStyle(c1)
    let cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.onclick = function () {
        let courseId = course.resource_id;
        if (selected.has(courseId)) {
            selected.delete(courseId)
        } else {
            selected.add(courseId)
            if (selected.size === total) {
            }
        }
        console.log(selected)
    }
    c1.appendChild(cb)
    row.appendChild(c1)
    let c2 = document.createElement('td')
    setTableStyle(c2)
    c2.innerText = getFlag(course.is_free, course.is_password)
    row.appendChild(c2)
    let c3 = document.createElement('td')
    setTableStyle(c3)
    c3.innerText = course.title
    row.appendChild(c3)
    toolTableBody.appendChild(row)
}

function setTableStyle(t) {
    t.style.border = 'solid'
    t.style.padding = '4px'
    t.style.margin = '10px'
}

function setStyle(t) {
    t.style.padding = '4px'
    t.style.margin = '5px'
}

function getFlag(isFree, isPassword) {
    return isFree ? (isPassword ? '加密' : '免费') : '付费';
}

let builders = [function (context, resolve, reject) {
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
    $.get("/xe.course.b_admin_r.image_text.detail.get/1.0.0", {resource_id: context.resource_id}, function (data, status) {
        if (status !== 'success') {
            alert("获取content失败 status=" + status)
            reject()
            return
        }
        context.content = data.data
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
        sellData.sale_type = 2
        sellData.period_type = 1
        sellData.limitPurchaseType = 2
        sellData.password = password.value
        sellData.period_value = (expiredDate.value + ' 00:00:00')
        console.log(context)
        $.ajax({
            type: 'POST',
            url: "/xe.course.b_admin_w.image_text.update/1.0.0",
            cache: false,
            contentType: "application/json",
            data: JSON.stringify(context),
            success: function (result) {
                console.log("修改成功 " + result)
                resolve()
            }
        })
    }, () => {
        console.log("部分信息获取失败 id=" + id)
        resolve()
    })
}
