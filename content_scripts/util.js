util = {}

util.closeStrategyPropertyDialog = async () => {
    if (document.querySelector(SEL.okBtn)) {
        document.querySelector(SEL.okBtn).click()
        page.waitForTimeout(100)
    }
}

util.openStrategyTab = async () => {
    const strategyTabActive = await page.waitForSelector(SEL.strategyTesterTabActive, 500)
    if (!strategyTabActive) {
        page.mouseClickSelector(SEL.strategyTesterTab)
        await page.waitForTimeout(80)
    }
}

util.openPineEditorTab = async () => {
    const strategyTabActive = await page.waitForSelector(SEL.scriptEditorActive, 500)
    if (!strategyTabActive) {
        page.mouseClickSelector(SEL.scriptEditorTab)
        page.waitForTimeout(80)
    }
}

util.verifyTimeFrame = async (tfs) => {
    if (!tfs || !tfs.length) {
        return;
    }
    let timeframes = await tvChart.getAllUserTimeframes()
    for (let tf of tfs) {
        if (!timeframes.includes(tf)) {
            const strategyTF = tvChart.correctTF(tf)
            // Search timeframe among timeframes menu items
            const timeFrameMenuEl = await page.waitForSelector(SEL.chartTimeframeMenuOrSingle)
            if (!timeFrameMenuEl)
                throw new Error('There is no timeframe selection menu element on the page')

            await page.waitForTimeout(200)
            if (!timeFrameMenuEl.matches('[class*="isOpened"]')) {
                page.mouseClick(timeFrameMenuEl)
            }
            const menuTFItem = await page.waitForSelector(SEL.chartTimeframeMenuItem, 1500)
            if (!menuTFItem)
                throw new Error('There is no item in timeframe menu on the page')

            await page.waitForTimeout(200)
            let foundTF = await tvChart.selectTimeFrameMenuItem(strategyTF)
            if (foundTF) {
                continue;
            }
            await util.addTimeframe(strategyTF)
        }
    }
}

util.addTimeframe = async (strategyTF) => {
    console.log('util.addTimeframe:', strategyTF)
    // Open Add new custom Timeframe dialog
    const timeFrameMenuAddCustomTf = await document.querySelector(SEL.chartTimeframeMenuAddCustomTf)
    if (!timeFrameMenuAddCustomTf)
        throw new Error('There is no timeframe selection menu element on the page')
    page.mouseClick(timeFrameMenuAddCustomTf)
    await page.waitForTimeout(1000)

    const tfValueEl = await document.querySelector(SEL.chartTimeframeAddCustomDialogInput)
    if (!tfValueEl)
        throw new Error(`There is no input element to set value of timeframe`)
    //tfValueEl.scrollIntoView()
    page.setInputElementValue(tfValueEl, strategyTF.substr(0, strategyTF.length - 1))

    page.mouseClickSelector(SEL.chartTimeframeAddCustomDialogType)
    const isTFTypeEl = await page.waitForSelector(SEL.chartTimeframeMenuTypeItems, 1500)
    if (!isTFTypeEl)
        throw new Error(`The elements of the timeframe type did not appear while adding it`)
    switch (strategyTF[strategyTF.length - 1]) {
        case 'm':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsMin)
            break;
        case 'h':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsHours)
            break;
        case 'D':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsDays)
            break;
        case 'W':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsWeeks)
            break;
        case 'M':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsMonth)
            break;
        case 'r':
            page.mouseClickSelector(SEL.chartTimeframeMenuTypeItemsRange)
            break;
        default:
            return { error: 7, message: `Unknown timeframe type in "${strategyTF}"` }
    }
    page.mouseClickSelector(SEL.chartTimeframeAddCustomDialogAddBtn)
}

util.openDataWindow = async () => {
    let btnObjectTreeDataWindowEl = document.querySelector(SEL.dataWindowAndObjectTreeBtn)
    if (btnObjectTreeDataWindowEl.ariaPressed === "false") {
        btnObjectTreeDataWindowEl.click()
        await page.waitForTimeout(50)
    }
    let btnDataWindowEl = await page.waitForSelector(SEL.dataWindowBtn, 200)
    if (btnDataWindowEl.ariaSelected === "false") {
        btnDataWindowEl.click()
        await page.waitForTimeout(50)
    }
}

util.switchToStrategySummaryTab = async () => {
    await switchToStrategyTab(SEL.strategySummary, SEL.strategySummaryActive, 'Performance')
}

util.switchToStrategyTradesAnalysisTab = async () => {
    await switchToStrategyTab(SEL.strategyTradesAnalysis, SEL.strategyTradesAnalysisActive, 'Trades analysis')
}

util.switchToStrategyRatioTab = async () => {
    await switchToStrategyTab(SEL.strategyRatios, SEL.strategyRatiosActive, 'Risk/performance ratios')
}

util.switchToStrategyTradesTab = async () => {
    await switchToStrategyTab(SEL.strategyTrades, SEL.strategyTradesActive, 'List of trades')
}

util.equals = (x, y) => {
    if (Object.keys(x).length === 0 && Object.keys(y).length === 0) {
        return true
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false
    }

    var objectsAreSame = true;
    for (var propertyName in x) {
        if (x[propertyName] !== y[propertyName]) {
            objectsAreSame = false;
            break;
        }
    }
    return objectsAreSame;
}

async function switchToStrategyTab(sel1, sel2, tabName) {
    await util.openStrategyTab()

    if (global.isDeepTest) {
        await tv.generateDeepTestReport()
    }

    let element = await page.waitForSelector(sel1, 1000)
    if (!element) {
        throw new Error(`There is not "${tabName}" tab on the page. Open correct page.`)
    }
    if (!page.$(sel2)) {
        element.click()
        await page.waitForTimeout(80)
    }
    const isActive = await page.waitForSelector(sel2, 1000)
    if (!isActive && !global.isDeepTest) {
        console.log(`The "${tabName}" tab is not active after click`)
    }
}

util.getTickerExchange = async () => {
    let tickerName = await tvChart.getTicker()
    let dataWindowWidgetEl = document.querySelector(SEL.dataWindowWidget)
    let headers = dataWindowWidgetEl.querySelectorAll('span[class^="headerTitle-"]')

    for (let header of headers) {
        console.log('getTickerExchange process header:', header.innerText)
        if (header.innerText && header.innerText.includes(tickerName)) {
            return header.innerText.replace(/ ·.*· /, '-').trim()
        }
    }
    return null
}

util.getRandomInt = function (max, min) {
    return Math.floor(Math.random() * (45 - 20) + 20)
}

util.normalize = (value) => {
    if (typeof value !== 'string') {
        return value;
    }
    console.log('normalize value', value)
    let result = value.trim(); // remove leading and trailing spaces
    result = result.replace(/[\s,]+$/, ''); // remove trailing spaces and commas
    result = result.replaceAll(', ', ','); // remove spaces after commas

    return result;
}
util.normalizeExchange = (value) => {
    if (value.length === 0) return value

    let result = util.normalize(value);

    let exchanges = result.split(',');
    exchanges = prependExchangePrefix(exchanges);
    result = exchanges.join(',');

    return result;
}

util.getProfitFactorKey = (pfName) => {
    if (pfName.includes('Long') && pfName.includes('Trend')) {
        return NOVA_TREND_LONG_PF
    } else if (pfName.includes('Short') && pfName.includes('Trend')) {
        return NOVA_TREND_SHORT_PF
    } else if (pfName.includes('Long') && pfName.includes('Reversion')) {
        return NOVA_REVERSION_LONG_PF
    } else if (pfName.includes('Short') && pfName.includes('Reversion')) {
        return NOVA_REVERSION_SHORT_PF
    } else if (pfName.includes('Long')) {
        return LONG_PF
    } else if (pfName.includes('Short')) {
        return SHORT_PF
    }
    console.warn('Unknown profit factor name:', pfName)
    return pfName
}

util.parseTfList = (listOfTF) => {
    let errorMsg = null;
    function fixTf(tf) {
        const supportedSeconds = [1, 5, 10, 15, 30, 45]
        let unit = tf.slice(-1);
        let num = parseInt(tf.slice(0, tf.length - 1));
        switch (unit) {
            case 's':
                if (!supportedSeconds.includes(num)) {
                    errorMsg = `Timeframe value is not supported (${tf}). Supported values for seconds are: ${supportedSeconds.join(', ')}`;
                }
                return tf
            case 'm':
                if (num >= 10000) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for minutes is 9999`;
                } else if (num % 60 === 0) {
                    return (num / 60) + 'h'
                }
                return tf
            case 'h':
            case 'H':
                if (num >= 25) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for hours is 24`;
                }
                return tf
            case 'd':
            case 'D':
                if (num >= 366) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for days is 365`;
                }
                return tf
            case 'w':
            case 'W':
                if (num >= 53) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for weeks is 52`;
                }
                return tf
            case 'M':
                if (num >= 13) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for months is 12`;
                }
                return tf
            case 'R':
                if (num > 999999) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for range is 999999`;
                }
                return tf
            case '':
                errorMsg = `Please specify a unit for the Timeframe (${tf})`;
                return tf
            default:
                return tf
        }
    }
    if (!listOfTF || typeof listOfTF !== 'string') return { error: null, data: [] };

    /**
     * Processes a comma-separated list of timeframes, normalizes them, and expands ranges into individual timeframes.
     *
     * @param {string} listOfTF - A comma-separated string of timeframes. Each timeframe can be a single unit (e.g., 'm', 'D'),
     *                            a range (e.g., '1D-3D'), or a range with a step (e.g., '1D-3D:2').
     * @returns {Array<string>} - An array of normalized timeframes.
     */
    let tfList = listOfTF.split(',').reduce((acc, tf) => {
        tf = tf.trim();
        if (tf === 'Chart' || tf === 'chart') {
            acc.push('Chart');
            return acc;
        }
        tf = tf.replaceAll('d', 'D').replaceAll('w', 'W').replaceAll('r', 'R').replaceAll('H', 'h').replaceAll('S', 's')

        if (tf.length === 1 && !/[tsmhDWMR]$/.test(tf)) {
            errorMsg = `Invalid value "${tf}" add a valid unit (s, m, h, D, W, M, R)`;
            return acc;
        }
        else if (tf.length > 1 && !/^\d/.test(tf)) {
            errorMsg = `Invalid value "${tf}". Timeframe must start with a number.`;
            return acc;
        }
        else if (tf.includes(':') && !tf.includes('-')) {
            errorMsg = `Invalid value ":" in "${tf}". Use "-" to specify a range or remove ":" if not needed.`;
            return acc;
        }
        else if (tf.includes(':') && !/\d$/.test(tf)) {
            errorMsg = `Invalid value "${tf}" add a valid unit (s, m, h, D, W, M, R)`;
            return acc;
        }
        else if ((!tf.includes(':') && !/[tsmhDWMR]$/.test(tf))) {
            errorMsg = `Invalid value "${tf}" add a valid unit (s, m, h, D, W, M, R)`;
            return acc;
        }

        tf = tf.length === 1 ? "1" + tf : tf // m -> 1m, D -> 1D...

        if (tf.includes('-')) {
            let step = tf.includes(':') ? parseInt(tf.split(':')[1]) : 1;
            const [start, end] = tf.replace(/:\d+$/g, '').split('-').map(t => t.trim());
            const unit = start.slice(-1);
            if (unit !== end.slice(-1)) {
                errorMsg = `Timeframe range must have the same unit: ${tf}`;
                return acc;
            }
            let [startNum, endNum] = [parseInt(start), parseInt(end)];
            if (startNum > endNum) [startNum, endNum] = [endNum, startNum];

            for (let i = startNum; i <= endNum; i += step) {
                let newTf = i + unit;
                newTf = fixTf(newTf);
                if (errorMsg)
                    return acc
                acc.push(newTf);
                if (i + step > endNum && i !== endNum) {
                    i = endNum - step;
                }
            }
        } else {
            tf = fixTf(tf);
            if (errorMsg)
                return acc
            acc.push(tf);
        }
        return acc;
    }, []);

    if (errorMsg) return { error: errorMsg, data: null };
    tfList = [...new Set(tfList)];
    const validTFs = tfList.filter(tf => /(^\d+[mhdsDWMR]$)|^Chart$/i.test(tf));
    return { error: null, data: validTFs };
}

util.scrollToBottom = async (element) => {
    if (element) {
        element.scrollTop = element.scrollHeight;
        await page.waitForTimeout(100)
    }
}

util.parseInputValue = (elem) => {
    let propValue = elem.querySelector('input').value
    if (elem.querySelector('input').getAttribute('inputmode') === 'numeric' ||
        (parseFloat(propValue) == propValue || parseInt(propValue) == propValue)) { // not only inputmode==numbers input have digits
        const digPropValue = parseFloat(propValue) == parseInt(propValue) ? parseInt(propValue) : parseFloat(propValue)  // Detection if float or int in the string
        if (!isNaN(propValue))
            return digPropValue
        else
            return propValue
    }
    return propValue
}

util.parseSelectValue = (elem) => {
    const buttonEl = elem.querySelector('span[role="button"]')
    if (!buttonEl)
        return null
    const propValue = buttonEl.innerText
    if (propValue) {
        return propValue
    }
}

function prependExchangePrefix(exchanges) {
    let lastExchangePrefix = null;
    // Keep track of the last exchange prefix
    // and prepend it to exchanges that don't have a prefix
    // This is to handle cases like "BITGET:BTCUSD, ETHUSD" where ETHUSD should be BITGET:USD
    exchanges = exchanges.map(exchange => {
        if (exchange.includes(':')) {
            lastExchangePrefix = exchange.split(':')[0];
            return exchange;
        } else if (lastExchangePrefix) {
            return `${lastExchangePrefix}:${exchange}`;
        }
        return exchange;
    });
    exchanges = exchanges.map(exchange => exchange.trim().toUpperCase());
    exchanges = [...new Set(exchanges)]; // Remove duplicates
    exchanges = exchanges.filter(exchange => exchange.length > 0); // Remove empty strings
    exchanges.sort(); // Sort exchanges alphabetically
    return exchanges;
}

util.getExchangeString = (exchangeEl) => {
    if (exchangeEl.disabled === false) {
        let exchanges = exchangeEl.value;
        exchanges = util.normalize(exchanges);
        if (exchanges.length === 0) {
            return 'EXCHANGE';
        }

        exchanges = exchanges.length === 0 ? ['EXCHANGE'] : exchanges.split(',');
        exchanges = prependExchangePrefix(exchanges);

        let exchangeMap = {};
        exchanges.forEach(exchange => {
            let [key, value] = exchange.split(':');
            if (key && value) {
                if (!exchangeMap[key]) {
                    exchangeMap[key] = [];
                }
                exchangeMap[key].push(value);
            }
        });
        let exchangeStr = '';
        for (let key in exchangeMap) {
            if (exchangeMap.hasOwnProperty(key)) {
                let values = exchangeMap[key].join('-');
                if (exchangeStr.length > 0) {
                    exchangeStr += '-';
                }
                exchangeStr += key + '(' + values + ')';
            }
        }
        return exchangeStr
    }
    return 'EXCHANGE';
}

util.convertToTimeframe = (tf) => {
    if (typeof tf === 'string' && tf.toLowerCase() === 'chart') {
        return 'Chart';
    }
    if (tf.endsWith('t')) {
        return tf.replace('t', ' tick');
    } else if (tf.endsWith('s')) {
        return tf.replace('s', ' second');
    } else if (tf.endsWith('m')) {
        return tf.replace('m', ' minute');
    } else if (tf.endsWith('h')) {
        return tf.replace('h', ' hour');
    } else if (tf.endsWith('D')) {
        return tf.replace('D', ' day');
    } else if (tf.endsWith('W')) {
        return tf.replace('W', ' week');
    } else if (tf.endsWith('M')) {
        return tf.replace('M', ' month');
    }
    return tf;
}