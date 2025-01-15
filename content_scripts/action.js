const action = {
    workerStatus: null,
    bestStrategyNumberCount: 0
}

const IMPULS = 'Impulse IQ Backtester [Trading IQ]'
const REVERSAL = 'Reversal IQ Backtester [Trading IQ]'
const COUNTER_STRIKE = 'Counter Strike Backtester [Trading IQ]'
const NOVA = 'Nova IQ Backtester [Trading IQ]'
const SUPPORTED_STRATEGIES = [IMPULS, REVERSAL, COUNTER_STRIKE, NOVA];
const PERFORMANCE_VALUES = ['Net Profit %: All', 'Max Drawdown %', 'Profit Factor: Long', 'Profit Factor: Short', 'Percent Profitable: Long', 'Percent Profitable: Short', 'Total Closed Trades: Long', 'Total Closed Trades: Short', 'Avg # Bars in Trades: Long', 'Avg # Bars in Trades: Short', 'Number Winning Trades: All', 'Number Winning Trades: Long', 'Number Winning Trades: Short', 'Number Losing Trades: All', 'Number Losing Trades: Long', 'Number Losing Trades: Short']
const STATUS_MSG = 'Please do not click on the page elements.<br>And do not change the window/tab.<br>If the Tradingview page is not in the foreground, the extension will not work.'
action.initIq = async (request) => {
    console.log('action.initIq')
    try {
        let timeout = request.options.timeout * 1000 //convert to ms
        let retry = request.options.retry
        let iqIndicator = request.options.iqIndicator

        let tf = action._parseTF(request.options.tf)
        if (tf.error !== null) {
            await ui.showPopup(tf.error)
            return
        }
        ui.statusMessage(STATUS_MSG)
        tf = tf.data[0]
        console.log('Set timeframe:', tf)
        await tvChart.changeTimeFrame(tf)

        await util.openDataWindow()
        await util.openStrategyTab()
        let iqWidget = await action.enableStrategy(iqIndicator.replace('tester [Trading IQ]', '').trim())
        if (!iqWidget) {
            await ui.showPopup(iqIndicator + ' could not be added. Please reload the page and try again.')
            return
        }
        //set strategy params
        let bestStrategyNumbers = await startTest(iqIndicator, false, iqWidget, timeout, retry, tf)
        if (Object.keys(bestStrategyNumbers).length === 0) {
            await ui.showPopup('No best strategy numbers found after 5 attempts. Please try again later.')
            return
        }
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
}

action.testStrategy = async (request) => {
    console.log('action.testStrategy')
    action.bestStrategyNumberCount = 0
    try {
        let timeout = request.options.timeout * 1000 //convert to ms
        let retry = request.options.retry
        let tfList = action._parseTF(request.options.tfList)
        if (tfList.error !== null) {
            await ui.showPopup(tfList.error)
            return
        }
        if (tfList.data.length === 0) {
            await ui.showPopup('No timeframes selected. Please select at least one timeframe.')
            return
        }
        tfList = tfList.data
        console.log('tfList', tfList)

        ui.statusMessage(STATUS_MSG)

        await util.openDataWindow()
        await util.openStrategyTab()

        let strategyData = await getStrategyData()
        let strategyName = strategyData.strategyName
        let iqWidget = strategyData.iqWidget
        console.log('strategyName:', (!strategyName ? 'null' : strategyName), 'iqWidget:', iqWidget)
        if (!strategyName || !iqWidget || !SUPPORTED_STRATEGIES.includes(strategyName)) {
            await ui.showPopup('No strategy found. Only Nova IQ, Impulse IQ, Reversal IQ and Counter Strike IQ are supported.')
            return
        }

        const deepCheckboxEl = await page.waitForSelector(SEL.strategyDeepTestCheckbox)
        const isDeepTest = Boolean(deepCheckboxEl.checked)

        let testReport = []
        let header = []
        let symbol = null
        for (const tf of tfList) {
            if (action.workerStatus === null) {
                console.log('Stopped by User')
                break
            }
            console.log('Set timeframe:', tf)
            await tvChart.changeTimeFrame(tf)

            let testResults = {}
            testResults.isDeepTest = isDeepTest

            let bestStrategyNumbers = await startTest(strategyName, isDeepTest, iqWidget, timeout, retry, tf)
            if (Object.keys(bestStrategyNumbers).length === 0 && testReport.length === 0) {
                await ui.showPopup('No best strategy numbers found after 5 attempts. Please try again later.')
                return
            }
            if (action.bestStrategyNumberCount === 0) {
                action.bestStrategyNumberCount = Object.keys(bestStrategyNumbers).length
            }

            if (isDeepTest) {
            }

            let testResult = await tv.getPerformance(testResults)
            let strategyParams = await tv.getStrategyPropertyData()
            if (symbol === null && strategyParams.Symbol) {
                symbol = strategyParams.Symbol.replace(':', '-')
            }
            delete strategyParams['Symbol']

            if (testReport.length === 0) {
                header = action.createReportHeader(bestStrategyNumbers, strategyParams)
                testReport.push(header)
            }

            testReport.push(action.createReport(tf, bestStrategyNumbers, testResult, strategyParams))
        }

        ui.statusMessageRemove()
        if (request.options.reportFormat === "1") {
            console.log('create HTML report')
            const data = file.createHTML(symbol, strategyName, testReport)
            file.saveAs(data, `${symbol}_${strategyName}.html`)
        }
        else {
            console.log('create CSV report')
            const data = file.createCSV(testReport)
            file.saveAs(data, `${symbol}_${strategyName}.csv`)
        }
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
}

async function startTest(strategyName, isDeepTest, iqWidget, timeout, retryCount, tf) {
    for (let i = 1; i <= retryCount; i++) {
        console.log(i + '. try to get best strategy numbers for tf: ', tf)
        let bestStrategyNumbers = await action.test(strategyName, isDeepTest, iqWidget, timeout)
        if (Object.keys(bestStrategyNumbers).length === 0) {
            //we will switch back and forth between previous and current timeframe. Sometimes it helps to get the values
            console.log(i + '. try to get best strategy numbers for tf: ', tf)
            let tf1 = "1m" === tf ? "2m" : "1m"
            await tvChart.changeTimeFrame(tf1)
            await page.waitForTimeout(1000)
            await tvChart.changeTimeFrame(tf)
        } else {
            return bestStrategyNumbers
        }
    }
    return {}
}

action.createReportHeader = (bestStrategyNumbers, strategyParams) => {
    let header = []
    header.push('Timeframe')
    for (let key in bestStrategyNumbers) {
        header.push(key)
    }
    header.push('Net Profit %')
    header.push('Max Drawdown %')
    header.push('PF Long')
    header.push('PF Short')
    header.push('Profitable Long %')
    header.push('Profitable Short %')
    header.push('Closed Trades Long')
    header.push('Closed Trades Short')
    header.push('Avg Bars Long')
    header.push('Avg Bars Short')
    header.push('Winning Trades All')
    header.push('Winning Trades Long')
    header.push('Winning Trades Short')
    header.push('Losing Trades All')
    header.push('Losing Trades Long')
    header.push('Losing Trades Short')

    for (let key in strategyParams) {
        header.push(key)
    }
    return header
}

action.createReport = (tf, bestStrategyNumbers, testResult, strategyParams) => {
    let report = []
    report.push(tf)

    for (let i = 0; i < action.bestStrategyNumberCount; i++) {
        if (i < Object.keys(bestStrategyNumbers).length) {
            let key = Object.keys(bestStrategyNumbers)[i]
            report.push(bestStrategyNumbers[key])
        } else {
            report.push(-1)
        }
    }

    if (testResult.data !== null) {
        for (let index in PERFORMANCE_VALUES) {
            let key = PERFORMANCE_VALUES[index]
            let val = testResult.data[key]
            report.push(val)
        }
    }

    for (let key in strategyParams) {
        let val = strategyParams[key]
        if (key.startsWith('LTF') || key.startsWith('HTF')) {
            if (val === null || val.length === 0) {
                val = 'Chart'
            } else {
                val += 'm'
            }
        }
        report.push(val)
    }
    return report
}

async function getStrategyData() {
    let strategyCaptionEl = document.querySelector(SEL.strategyCaption)
    let strategyName = null
    let iqWidget = null
    if (!strategyCaptionEl || !SUPPORTED_STRATEGIES.includes(strategyCaptionEl.innerText)) {
        iqWidget = await action.enableStrategy(null) //Enable first Trading IQ strategy
        strategyCaptionEl = await page.waitForSelector(SEL.strategyCaption, 500)
        strategyName = strategyCaptionEl.innerText
    } else {
        strategyName = strategyCaptionEl.innerText
        iqWidget = await action.enableStrategy(strategyName)
    }
    return { strategyName: strategyName, iqWidget: iqWidget }
}

action.getStrategyFromDataWindow = async (strategyName) => {
    // Enable the strategy
    let dataWindowWidgetEl = document.querySelector(SEL.dataWindowWidget)
    let headers = dataWindowWidgetEl.getElementsByClassName('headerTitle-_gbYDtbd')
    let iqWidgetEl = null
    for (let header of headers) {
        if (header.innerText && header.innerText.includes(IMPULS) || header.innerText.includes(REVERSAL) || header.innerText.includes(COUNTER_STRIKE) || header.innerText.includes(NOVA)) {
            let iqWidget = header.parentElement.parentElement
            if (header.innerText.includes(strategyName) || strategyName === null) {
                strategyName = header.innerText
                iqWidgetEl = iqWidget
                if (iqWidget.className.includes('hidden-_gbYDtbd')) {
                    page.mouseClick(header.parentElement.getElementsByTagName('button')[0])
                    await page.waitForTimeout(20)
                }
            } else if (!iqWidget.className.includes('hidden-_gbYDtbd')) {
                page.mouseClick(header.parentElement.getElementsByTagName('button')[0])
                await page.waitForTimeout(20)
            }
        }
    }
    return iqWidgetEl
}

//Enables the strategy if strategyName === null enable first one in the DataWindow-Widget and disabled all other Trading IQ strategies
//If strategyName is not found, add strategy to the DataWindow-Widget
action.enableStrategy = async (strategyName) => {
    let iqWidgetEl = await action.getStrategyFromDataWindow(strategyName)

    //If iqWidget is still null, add strategy to the DataWindow-Widget
    if (iqWidgetEl === null) {
        console.log('Add strategy to the DataWindow-Widget')
        page.mouseClickSelector(SEL.indicatorDropdown)
        let sideBarTabs = []
        let maxTime = Date.now() + 30000
        while (true) {
            await page.waitForTimeout(500)
            sideBarTabs = [...document.querySelectorAll(SEL.indicatorsDialogSideBarTabs)]
            let filteredMap = sideBarTabs.map(div => div.innerText).filter(txt => txt.includes('Invite-only'))
            if (action.workerStatus === null || Date.now() > maxTime || filteredMap.length > 0) {
                break
            }
        }

        if (!sideBarTabs) {
            return null
        }

        let inviteOnlyTab = sideBarTabs[sideBarTabs.length - 1]
        if (!inviteOnlyTab) {
            return null
        }
        if (!inviteOnlyTab.classList.contains('active')) {
            page.mouseClick(inviteOnlyTab)
            await page.waitForTimeout(150)
        }

        let indicatorList = document.querySelectorAll(SEL.indicatorsDialogContentList)
        if (!indicatorList) {
            return null
        }
        maxTime = Date.now() + 30000
        let found = false
        let isCounterStrike = COUNTER_STRIKE.includes(strategyName)
        while (true) {
            await page.waitForTimeout(500)
            indicatorList = document.querySelectorAll(SEL.indicatorsDialogContentList)
            if (indicatorList) {
                for (let item of indicatorList) {
                    if (item.innerText.includes(isCounterStrike ? 'Counter Strike IQ Back' : strategyName)) {
                        item.focus()
                        page.mouseClick(item)
                        found = true
                        break
                    }
                }
            }
            if (action.workerStatus === null || found || Date.now() > maxTime) {
                break
            }
        }

        if (!found) {
            console.log(strategyName + ' not found in the invite only tab', indicatorList)
            return null
        }

        maxTime = Date.now() + 60000
        while (true) {
            await page.waitForTimeout(250)
            iqWidgetEl = await action.getStrategyFromDataWindow(strategyName)
            if (action.workerStatus === null || iqWidgetEl || Date.now() > maxTime) {
                break
            }
        }

        let closeBtn = document.querySelector(SEL.indicatorsDialogCloseBtn)
        if (closeBtn) {
            page.mouseClick(closeBtn)
            await page.waitForTimeout(150)
        }
    }

    return iqWidgetEl
}


action.test = async (name, isDeepTest, iqWidget, timeout) => {
    console.log('action.test: ' + name)
    await util.openDataWindow()
    await util.openStrategyTab()

    let iqValues = []
    let tick = 1000
    let selReportReady = isDeepTest ? SEL.strategyReportDeepTestReady : SEL.strategyReportReady

    for (let i = 0; i < timeout / tick; i++) {
        console.log('waiting for ' + name + ' values')

        if (action.workerStatus === null) {
            break
        }

        await util.openDataWindow()
        await util.openStrategyTab()

        if (isDeepTest) {
            let resultMsg = await tv.generateDeepTestReport()
            console.log('Deep Test Result:', resultMsg)
        } else {
            page.mouseClickSelector(SEL.strategySummaryActive)
        }
        await page.waitForTimeout(50)
        iqValues = iqWidget.getElementsByClassName('item-_gbYDtbd')
        isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, tick)
        isProcessError = isProcessError || document.querySelector(SEL.strategyReportError)

        await tv.switchToStrategySummaryTab()
        isProcessEnd = document.querySelector(selReportReady)
        if (isProcessError || (isProcessEnd && iqValues.length > 0)) {
            console.log('Process is finished isProcessError:', isProcessError, 'isProcessEnd:', isProcessEnd, 'iqValues:', iqValues.length)
            break
        }
    }

    let isNova = name === NOVA
    const propVal = {}
    for (let value of iqValues) {
        let values = value.innerText.split('\n')
        if (values[0].includes('Best Long')) {
            let bestLong = parseInt(values[1].replace(',', ''))
            let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Long Stratgy Reversion Number' : 'Best Long Stratgy Trend Number')
            propVal[propName] = bestLong
        }
        else if (values[0].includes('Best Short')) {
            let bestShort = parseInt(values[1].replace(',', ''))
            let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Short Stratgy Reversion Number' : 'Best Short Stratgy Trend Number')
            propVal[propName] = bestShort
        }
    }
    if (Object.keys(propVal).length === 0) {
        console.log('No values found for ' + name + ' in the Data Window.')
        return propVal
    }
    console.log('Set best strategy numbers: propVal', propVal)
    await tv.setStrategyParams(name, propVal)

    if (isDeepTest) {
        await page.waitForTimeout(1000)
        let resultMsg = await tv.generateDeepTestReport()
        console.log('Deep Test Result::', resultMsg)
    }

    return propVal
}

action._parseTF = (listOfTF) => {
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
            default:
                return tf;
        }
    }
    if (!listOfTF || typeof listOfTF !== 'string') return { error: null, data: [] };


    const tfList = listOfTF.split(',').reduce((acc, tf) => {
        tf = tf.trim();
        tf = tf.replaceAll('d', 'D').replaceAll('w', 'W').replaceAll('r', 'R').replaceAll('H', 'h').replaceAll('S', 's')
        tf = tf.length === 1 ? "1" + tf : tf // m -> 1m, D -> 1D...

        if (tf.includes('-')) {
            const [start, end] = tf.split('-').map(t => t.trim());
            const unit = start.slice(-1);
            if (unit !== end.slice(-1)) {
                errorMsg = `Timeframe range must have the same unit: ${tf}`;
                return acc;
            }
            let [startNum, endNum] = [parseInt(start), parseInt(end)];
            if (startNum > endNum) [startNum, endNum] = [endNum, startNum];
            for (let i = startNum; i <= endNum; i++) {
                let newTf = i + unit;
                newTf = fixTf(newTf);
                if (errorMsg)
                    return acc
                acc.push(newTf);
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

    const validTFs = tfList.filter(tf => /(^\d{1,2}[mhdsDWMR]$)/.test(tf));
    return { error: null, data: validTFs };
}
