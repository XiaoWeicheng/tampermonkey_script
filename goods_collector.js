// ==UserScript==
// @name         商品信息收集
// @namespace    https://ownmind.space
// @version      1.1
// @description  收集搜索页面的商品信息并导出为 xlsx 文件
// @author       xiaoweicheng
// @downloadURL  https://raw.githubusercontent.com/XiaoWeicheng/tampermonkey_script/refs/heads/main/goods_collector.js
// @updateURL    https://raw.githubusercontent.com/XiaoWeicheng/tampermonkey_script/refs/heads/main/goods_collector.js
// @match        https://s.taobao.com/search*
// @match        https://www.goofish.com/search*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// ==/UserScript==

(function () {
    'use strict';

    // 添加日志函数
    function log(message, data = null) {
        const prefix = '[商品采集]';
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    function getSearchKeyword() {
        const isGoofish = window.location.hostname === 'www.goofish.com';
        let keyword = '';

        // 从 URL 获取关键词
        keyword = new URLSearchParams(window.location.search).get('q');

        // 如果 URL 中没有关键词，尝试从搜索框获取
        if (!keyword) {
            if (isGoofish) {
                keyword = document.querySelector('.search-input--Lc8KZpwx')?.value;
            } else {
                keyword = document.querySelector('#q')?.value;
            }
        }

        return keyword || '未知关键词';
    }

    // 收集当前页面商品信息
    async function collectCurrentPageProducts() {
        log('开始收集当前页商品信息');
        const products = [];
        const isGoofish = window.location.hostname === 'www.goofish.com';

        // 根据不同网站选择不同的选择器
        const items = isGoofish
            ? document.querySelectorAll('.feeds-item-wrap--rGdH_KoF')
            : document.querySelectorAll('.doubleCardWrapperAdapt--mEcC7olq, .Card--doubleCardWrapper--L2XFE73');

        log('找到商品数量:', items.length);

        items.forEach((item, index) => {
            try {
                let title, price, shopName, link, saleCount;

                if (isGoofish) {
                    // 闲鱼商品信息获取
                    title = item.querySelector('.main-title--sMrtWSJa')?.textContent.trim();
                    const priceNumber = item.querySelector('.number--NKh1vXWM')?.textContent;
                    price = priceNumber ? parseFloat(priceNumber) : 0;
                    shopName = item.querySelector('.seller-text--Rr2Y3EbB')?.textContent.trim();
                    link = 'https://www.goofish.com' + item.getAttribute('href');
                } else {
                    // 淘宝商品信息获取
                    const titleElement = item.querySelector('.title--qJ7Xg_90, .Title--title--jCOPvpf');
                    const priceIntElement = item.querySelector('.priceInt--yqqZMJ5a, .Price--priceInt--ZlsSi_M');
                    const priceFloatElement = item.querySelector('.priceFloat--XpixvyQ1, .Price--priceFloat--h2RR0RK');
                    const shopNameElement = item.querySelector('.shopName--hdF527QA, .ShopInfo--shopName--rg6mGmy');
                    const saleCountElement = item.querySelector('.realSales--XZJiepmt');

                    title = titleElement?.textContent.trim();
                    price = parseFloat(priceIntElement?.textContent + (priceFloatElement ? priceFloatElement.textContent : ''));
                    shopName = shopNameElement?.textContent.trim();
                    link = item.href;
                    const saleCountTextContent = saleCountElement?.textContent.trim();
                    saleCount = parseInt(saleCountTextContent.substr(0, saleCountTextContent.indexOf('人付款')));
                }

                if (title && price && shopName) {
                    products.push({
                        '商品名称': title,
                        '价格': price,
                        '销量': saleCount ? saleCount: 0,
                        '店铺名称': shopName,
                        '商品链接': link,
                        '采集时间': new Date().toLocaleString('zh-CN')
                    });
                    log(`成功收集第 ${index + 1} 个商品:`, { title, price, shopName });
                }
            } catch (error) {
                log(`处理第 ${index + 1} 个商品时出错:`, error);
            }
        });

        return products;
    }

    // 获取所有页面的商品信息
    async function collectAllPagesProducts() {
        log('开始收集所有页面商品信息');
        let allProducts = [];
        let currentPage = 1;
        const isGoofish = window.location.hostname === 'www.goofish.com';

        if (isGoofish) {
            // 闲鱼翻页逻辑
            currentPage = parseInt(document.querySelector('.search-pagination-page-box-active--vsBooIVl').textContent || currentPage);
            const maxPage = document.querySelectorAll('.search-pagination-page-box--AbqmJFFp')?.length || 1;
            log(`检测到总页数: ${maxPage}`);

            while (currentPage <= maxPage) {
                log(`正在收集第 ${currentPage}/${maxPage} 页`);
                const products = await collectCurrentPageProducts();
                allProducts = allProducts.concat(products);

                if (currentPage >= maxPage) {
                    log('已到达最后一页');
                    break;
                }

                const nextButton = document.querySelector(".search-pagination-arrow-container--lt2kCP6J:not([disabled]) > .search-pagination-arrow-right--CKU78u4z");
                if (!nextButton) {
                    log('未找到下一页按钮，提前结束');
                    break;
                }

                nextButton.click();
                const waitTime = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
                log(`等待页面加载... ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                currentPage++;
            }
        } else {
            // 淘宝翻页逻辑
            currentPage = parseInt(document.querySelector('.next-current')?.querySelector('.next-btn-helper')?.textContent) || currentPage;
            const maxPage = document.querySelector('.next-pagination-list')?.childNodes.length || 1;
            log(`检测到总页数: ${maxPage}`);

            while (currentPage <= maxPage) {
                log(`正在收集第 ${currentPage}/${maxPage} 页`);
                const products = await collectCurrentPageProducts();
                allProducts = allProducts.concat(products);

                if (currentPage >= maxPage) {
                    log('已到达最后一页');
                    break;
                }

                const nextButton = document.querySelector('button.next-next:not([disabled])');
                if (!nextButton) {
                    log('未找到下一页按钮，提前结束');
                    break;
                }

                nextButton.click();
                const waitTime = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
                log(`等待页面加载... ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                currentPage++;
            }
        }

        allProducts.sort((a, b) => b['销量'] - a['销量'] !=0 ? b['销量'] - a['销量'] : a['价格'] - b['价格']);
        log(`总共收集到 ${allProducts.length} 个商品，共翻页 ${currentPage} 次`);
        return allProducts;
    }

    // 修改导出按钮点击事件
    function createExportButton() {
        log('创建导出按钮');
        const button = document.createElement('div');
        button.innerHTML = `
            <div style="
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 9999;
                background: #FF4400;
                color: #fff;
                padding: 15px 20px;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                font-size: 14px;
            ">
                <span>导出全部商品</span>
            </div>
        `;
        const buttonElement = button.firstElementChild;
        buttonElement.addEventListener('click', async () => {
            log('开始导出全部商品');
            buttonElement.style.backgroundColor = '#999';
            buttonElement.textContent = '导出中...';

            try {
                const allProducts = await collectAllPagesProducts();
                if (allProducts.length > 0) {
                    exportToExcel(allProducts);
                } else {
                    alert('未找到商品信息！');
                }
            } catch (error) {
                log('导出过程出错:', error);
                alert('导出失败，请重试！');
            } finally {
                buttonElement.style.backgroundColor = '#FF4400';
                buttonElement.textContent = '导出全部商品';
            }
        });

        return buttonElement;
    }

    // 导出为 Excel 文件
    function exportToExcel(data) {
        try {
            log('开始导出Excel');
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "商品信息");

            // 设置列宽
            const wscols = [
                { wch: 50 }, // 商品名称
                { wch: 10 }, // 价格
                { wch: 10 }, // 销量
                { wch: 20 }, // 店铺名称
                { wch: 60 }, // 商品链接
                { wch: 20 }  // 采集时间
            ];
            ws['!cols'] = wscols;

            // 生成文件名
            const platform = window.location.hostname === 'www.goofish.com' ? '闲鱼' : '淘宝';
            const searchKeyword = getSearchKeyword();
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `${platform}_${searchKeyword}_${timestamp}.xlsx`;

            XLSX.writeFile(wb, fileName);
            log('Excel导出成功:', fileName);
        } catch (error) {
            log('导出Excel时出错:', error);
            alert('导出失败，请重试！');
        }
    }

    // 添加导出按钮到页面
    function addExportButton() {
        log('尝试添加导出按钮');
        const exportButton = createExportButton();
        document.body.appendChild(exportButton);

        // 添加点击事件
        exportButton.addEventListener('click', () => {
            log('点击导出按钮');
            const products = collectProductInfo();
            if (products.length > 0) {
                exportToExcel(products);
            } else {
                log('未找到商品信息');
                alert('未找到商品信息！');
            }
        });
    }

    // 开始执行
    log('脚本开始执行');
    addExportButton();
})();
