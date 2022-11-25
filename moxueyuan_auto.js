// ==UserScript==
// @name         自动点击我在
// @namespace    http://bestmind.space
// @version      1.0
// @description  自动点击我在
// @author       xiaoweicheng
// @downloadURL  https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @updateURL    https://github.com/XiaoWeicheng/tampermonkey_script/raw/main/moxueyuan_auto.js
// @match        https://wanweitech.study.moxueyuan.com/new/course/*
// @icon         https://static.moxueyuan.com/cdn/static/common/images/ht_gongkaike_icon.png
// @grant        none
// ==/UserScript==

const sleep = async function(ms,func) {
    await new Promise(resolve => setTimeout(resolve, ms))
    func()
}

const observe = async function(divSelector, buttonSelector, log) {
    while(true){
        var div = document.querySelector(divSelector)
        if(div){
            var outObserver = new MutationObserver(function (mutations, observer) {
                mutations.forEach(async function(mutation) {
                    if(mutation.oldValue.indexOf("display: none")){
                        observer.disconnect()
                        console.log(log)
                        document.querySelector(buttonSelector).click()
                        sleep(60000,function(){
                            observe(divSelector, buttonSelector, log)
                        })
                    }
                })
            }).observe(div, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ['style']
            })
            break
        }
        await sleep(2000)
    }
}

(function() {

    'use strict'

    observe(
        "#app > div > section > main > div > div:nth-child(7)",
        "#app > div > section > main > div > div:nth-child(7) > div > div.el-dialog__footer > div > div > div.dialog-footer-confirmed.theme-bg-h-hover",
        "“确定”按钮展示"
    )

    observe(
        "#app > div > section > main > div > div:nth-child(8)",
        "#app > div > section > main > div > div:nth-child(8) > div > div.el-dialog__footer > div > div > div",
        "“我在”按钮展示"
    )

})();
