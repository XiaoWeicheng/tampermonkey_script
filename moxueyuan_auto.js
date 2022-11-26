// ==UserScript==
// @name         魔学院自动点击
// @namespace    http://bestmind.space
// @version      1.3
// @description  魔学院自动点击
// @author       xiaoweicheng
// @downloadURL  https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @updateURL    https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @match        https://*.moxueyuan.com/new/course/*
// @icon         https://static.moxueyuan.com/cdn/static/common/images/ht_gongkaike_icon.png
// @grant        none
// ==/UserScript==

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function observe(divSelector, buttonSelector) {
    const div = document.querySelector(divSelector)
    const button = div.querySelector(buttonSelector)
    new MutationObserver(function (mutations, observer) {
        console.log(mutations)
        for (let i in mutations) {
            console.log(mutations[i])
            if (mutations[i].oldValue.indexOf("display: none") >= 0) {
                console.log("“" + button.innerText.trim() + "”按钮展示")
                button.click()
            }
        }
    }).observe(div, {
        attributes: true, attributeOldValue: true, attributeFilter: ['style']
    })
    console.log("监听“" + button.innerText.trim() + "”按钮成功")
}

(async function () {

    'use strict'

    await sleep(10000)

    observe("#app > div > section > main > div > div:nth-child(7)", "div > div.el-dialog__footer > div > div > div.dialog-footer-confirmed.theme-bg-h-hover")
    observe("#app > div > section > main > div > div:nth-child(8)", "div > div.el-dialog__footer > div > div > div")

})()
