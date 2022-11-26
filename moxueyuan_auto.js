// ==UserScript==
// @name         魔学院自动点击
// @namespace    http://bestmind.space
// @version      1.2
// @description  魔学院自动点击
// @author       xiaoweicheng
// @downloadURL  https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @updateURL    https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @match        https://*.moxueyuan.com/new/course/*
// @icon         https://static.moxueyuan.com/cdn/static/common/images/ht_gongkaike_icon.png
// @grant        none
// ==/UserScript==

(function () {
    const observe = function (divSelector, buttonSelector) {
        const div = document.querySelector(divSelector)
        const button = document.querySelector(buttonSelector)
        const callback = function (mutations, observer) {
            console.log(mutations)
            mutations.forEach(function (mutation) {
                console.log(mutation)
                if (mutation.oldValue.indexOf("display: none") >= 0) {
                    console.log("“"+button.innerText.trim()+"”按钮展示")
                    button.click()
                }
            })
        }
        const option = {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['style']
        }
        const observer = new MutationObserver(callback)
        observer.observe(div, option)
        console.log("监听“"+button.innerText.trim()+"”按钮成功")
    }
    observe(
        "#app > div > section > main > div > div:nth-child(7)",
        "#app > div > section > main > div > div:nth-child(7) > div > div.el-dialog__footer > div > div > div.dialog-footer-confirmed.theme-bg-h-hover",
    )
    observe(
        "#app > div > section > main > div > div:nth-child(8)",
        "#app > div > section > main > div > div:nth-child(8) > div > div.el-dialog__footer > div > div > div",
    )
})()
