const action = {
    workerStatus: null,
    bestStrategyNumberCount: 0,
    testResultNumberCount: 0,
    strategyParamsNumberCount: 0,
    timeout: 60000
}

const PERFORMANCE_VALUES = ['Net Profit %: All', 'Max Drawdown %', 'Profit Factor: Long', 'Profit Factor: Short', 'Percent Profitable: Long', 'Percent Profitable: Short', 'Total Closed Trades: Long', 'Total Closed Trades: Short', 'Avg # Bars in Trades: Long', 'Avg # Bars in Trades: Short', 'Number Winning Trades: All', 'Number Winning Trades: Long', 'Number Winning Trades: Short', 'Number Losing Trades: All', 'Number Losing Trades: Long', 'Number Losing Trades: Short']
const STATUS_MSG = 'Please do not click on the page elements.<br>And do not change the window/tab.<br>If the Tradingview page is not in the foreground, the extension will not work.'

action.testStrategy = async (request) => {
    console.log('action.testStrategy')
    action.bestStrategyNumberCount = 0
    try {
        action.timeout = request.options.timeout * 1000 //convert to ms
        let retry = request.options.retry
        let cycles = request.options.cycles
        let strategyProperties = request.options.strategyProperties
        let iqIndicator = request.options.iqIndicator
        let rfHtml = request.options.reportFormat.html
        let rfCsv = request.options.reportFormat.csv
        let isDeepTest = request.options.deeptest
        let deepfrom = request.options.deepfrom
        let deepto = request.options.deepto

        ui.statusMessage(STATUS_MSG)

        await util.openDataWindow()
        await util.openStrategyTab()

        let iqWidget = await action.enableStrategy(iqIndicator.replace('tester [Trading IQ]', '').trim())
        if (!iqWidget) {
            await ui.showPopup(iqIndicator + ' could not be added. Please reload the page and try again.')
            return
        }

        if (sw.newStrategyView === null) {
            await sw.init();
        }

        if (request.options.resetAtStart) {
            await tv.resetStrategyInputs(iqIndicator, isDeepTest)
        }

        //Set strategy properties
        await tv.setStrategyProps(iqIndicator, strategyProperties, isDeepTest)

        console.log('iqIndicator:', (!iqIndicator ? 'null' : iqIndicator), 'iqWidget:', iqWidget)
        await page.waitForTimeout(1000)

        let testReport = []
        let header = []
        let symbol = null
        let error = null
        let cyclesLength = cycles.length
        let currentCycle = 0
        for (const cycle of cycles) {
            if (action.workerStatus === null) {
                console.log('Stopped by User')
                break
            }

            ui.statusMessage(STATUS_MSG, `Backtest ${++currentCycle} / ${cyclesLength}`)
            if (cycle.tf !== CURRENT_TF) {
                await tvChart.changeTimeFrame(cycle.tf)
            }
            let deepCheckbox = document.querySelector(SEL.strategyDeepTestCheckbox)
            if (isDeepTest !== deepCheckbox.checked) {
                //deepCheckbox.click()
                page.mouseClick(deepCheckbox)
                await page.waitForTimeout(1500)
            }

            if (isDeepTest) {
                console.log('Set deep test date range:', deepfrom, deepto)
                let startDate = document.querySelector(SEL.strategyDeepTestStartDate)
                let endDate = document.querySelector(SEL.strategyDeepTestEndDate)
                if (startDate.value !== deepfrom) {
                    let msg = await tv.setDeepDateValues(startDate, deepfrom)
                    if (msg !== null) {
                        await ui.showPopup(msg)
                        return
                    }
                }
                if (endDate.value !== deepto) {
                    let msg = await tv.setDeepDateValues(endDate, deepto)
                    if (msg !== null) {
                        await ui.showPopup(msg)
                        return
                    }
                }
                let msg = await tv.generateDeepTestReport();
                console.log('Deep Test Result:', msg)

            }

            let testResults = {}
            testResults.isDeepTest = isDeepTest

            let bestStrategyNumbers = await processCycle(iqIndicator, isDeepTest, iqWidget, retry, cycle)
            if (Object.keys(bestStrategyNumbers).length === 0 && testReport.length === 0) {
                await ui.showPopup('No best strategy numbers found after 5 attempts. Please try again later.')
                return
            }
            if (action.bestStrategyNumberCount === 0) {
                action.bestStrategyNumberCount = Object.keys(bestStrategyNumbers).length
            }

            let testResult = null
            let strategyParams = null
            console.log('bestStrategyNumbers detected:', bestStrategyNumbers, 'Get performance values')
            for (let i = 1; i <= retry; i++) {

                testResult = await tv.getPerformance(testResults)
                strategyParams = await tv.getStrategyPropertyData(isDeepTest, deepfrom, deepto, iqIndicator)

                if (testResult.data === null || strategyParams === null) {
                    console.log('No test result or strategy params found. Retry:', i, 'strategyParams:', strategyParams, 'testResult:', testResult)
                    let tf1 = "1m" === cycle.tf ? "2m" : "1m"
                    await tvChart.changeTimeFrame(tf1)
                    await page.waitForTimeout(2000)
                    await tvChart.changeTimeFrame(cycle.tf)
                    await page.waitForTimeout(2000)
                }
                else {
                    break
                }
            }
            if (testReport.length === 0 && (testResult.data === null || strategyParams === null)) {
                console.log('No test result or strategy params found. Stop testing')
                error = 'Test results could not be found. Please try again again.'
                break
            }

            if (symbol === null && strategyParams.Symbol) {
                symbol = strategyParams.Symbol.replace(':', '-')
            }
            delete strategyParams['Symbol']

            if (testReport.length === 0) {
                header = action.createReportHeader(bestStrategyNumbers, testResult, strategyParams)
                testReport.push(header)
            }

            testReport.push(action.createReport(cycle.tf, bestStrategyNumbers, testResult, strategyParams, header))
        }

        if (error) {
            await ui.showPopup(error)
            return
        }

        ui.statusMessageRemove()
        if (rfHtml) {
            console.log('create HTML report')
            const data = file.createHTML(symbol, iqIndicator, testReport)
            file.saveAs(data, `${symbol}_${iqIndicator}.html`)
        }
        if (rfCsv) {
            console.log('create CSV report')
            const data = file.createCSV(symbol, iqIndicator, testReport)
            file.saveAs(data, `${symbol}_${iqIndicator}.csv`)
        }
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
}

async function processCycle(strategyName, isDeepTest, iqWidget, retryCount, cycle) {
    console.log('processCycle:', strategyName, 'isDeepTest', isDeepTest, 'cycle:', cycle)

    // TV changed the behavior: if the strategy parameters change, the best strategy numbers are not reset.
    // So we need to reset the strategy parameters before each cycle by changing the tf shortly.
    const cycleTf = cycle.tf === CURRENT_TF ? tvChart.getCurrentTimeFrame() : cycle.tf
    console.log('processCycle cycleTf:', cycleTf)
    let tf1 = "1m" === cycle.tf ? "2m" : "1m"
    await tvChart.changeTimeFrame(tf1)
    await page.waitForTimeout(500)
    await tvChart.changeTimeFrame(cycleTf)
    await page.waitForTimeout(500)

    await page.waitForTimeout(100)
    for (let i = 1; i <= retryCount; i++) {
        console.log(i + '. try to get best strategy numbers for tf: ', cycle.tf)
        let bestStrategyNumbers = await action.detectBestStrategyNumbers(strategyName, isDeepTest, iqWidget, cycle)
        console.log(i + '. detected best strategy numbers: ', bestStrategyNumbers)
        if (Object.keys(bestStrategyNumbers).length === 0) {
            //we will switch back and forth between previous and current timeframe. Sometimes it helps to get the values
            console.log(i + '. try to get best strategy numbers failed for tf: ', cycle.tf)
            let tf1 = "1m" === cycle.tf ? "2m" : "1m"
            await tvChart.changeTimeFrame(tf1)
            await page.waitForTimeout(1000)
            await tvChart.changeTimeFrame(cycle.tf)
        } else {
            return bestStrategyNumbers
        }
    }
    return {}
}

action.createReportHeader = (bestStrategyNumbers, testResult, strategyParams) => {
    let header = []
    header.push('Timeframe')
    for (let key in bestStrategyNumbers) {
        header.push(key)
    }

    action.testResultNumberCount = Object.keys(testResult.data).length
    for (let key in testResult.data) {
        header.push(key)
    }

    action.strategyParamsNumberCount = Object.keys(strategyParams).length
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
            report.push('NA')
        }
    }

    if (testResult.data !== null) {
        for (let i = 0; i < action.testResultNumberCount; i++) {
            if (i < Object.keys(testResult.data).length) {
                let key = Object.keys(testResult.data)[i]
                report.push(testResult.data[key])
            } else {
                report.push('NA')
            }
        }
    }

    for (let i = 0; i < action.strategyParamsNumberCount; i++) {
        if (i < Object.keys(strategyParams).length) {
            let key = Object.keys(strategyParams)[i]

            let val = strategyParams[key]
            if (key.startsWith('LTF') || key.startsWith('HTF')) {
                if (val === null || val.length === 0) {
                    val = 'Chart'
                } else if (val !== 'Chart') {
                    val += 'm'
                }
            }
            report.push(val)
        } else {
            report.push('NA')
        }
    }

    return report
}

action.getStrategyFromDataWindow = async (strategyName) => {
    // Enable the strategy
    let dataWindowWidgetEl = document.querySelector(SEL.dataWindowWidget)
    let headers = dataWindowWidgetEl.querySelectorAll('span[class^="headerTitle-"]')
    let iqWidgetEl = null
    for (let header of headers) {
        console.log('getStrategyFromDataWindow process header:', header.innerText)
        if (header.innerText && SUPPORTED_STRATEGIES.some(strategy => header.innerText.includes(strategy))) {
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
    console.log('getStrategyFromDataWindow iqWidgetEl:', iqWidgetEl)
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

action.detectBestStrategyNumbers = async (name, isDeepTest, iqWidget, cycle) => {
    console.log('detectBestStrategyNumbers: ' + name)
    await util.openDataWindow()
    await util.openStrategyTab()

    let iqValues = []
    let tick = 1000
    let selReportReady = isDeepTest ? sw.strategyReportDeepTestReady() : sw.strategyReportReady()

    await page.waitForTimeout(1000)
    console.log('Set indicator parameter:', cycle)
    await tv.setStrategyInputs(name, cycle, isDeepTest)
    if (isDeepTest) {
        await page.waitForTimeout(250)
        await tv.generateDeepTestReport()
    }

    for (let i = 0; i < action.timeout / tick; i++) {
        console.log('waiting for ' + name + ' values')

        if (action.workerStatus === null) {
            break
        }

        await util.openDataWindow()
        if (!sw.newStrategyView && (tick * i) % 5000 === 0) {
            await util.openPineEditorTab()
            await page.waitForTimeout(250)
        }
        await util.openStrategyTab()
        await page.waitForTimeout(250)
        iqValues = iqWidget.getElementsByClassName('item-_gbYDtbd')
        isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, 100)
        isProcessError = isProcessError || document.querySelector(SEL.strategyReportError)

        await util.switchToStrategySummaryTab(isDeepTest)
        isProcessEnd = document.querySelector(selReportReady)
        if (isProcessError || (isProcessEnd && iqValues.length > 0)) {
            console.log('Process is finished isProcessError:', isProcessError, 'isProcessEnd:', isProcessEnd, 'iqValues:', iqValues)
            break
        }
    }

    let isNova = name === NOVA
    let props = []
    for (let value of iqValues) {
        let values = value.innerText.split('\n')
        if (values[0].includes('Long Strategy')) {
            let bestLong = parseInt(values[1].replace(',', ''))
            let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Long Strategy Reversion Number' : 'Best Long Strategy Trend Number')
            props[propName] = bestLong
        }
        else if (values[0].includes('Short Strategy')) {
            let bestShort = parseInt(values[1].replace(',', ''))
            let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Short Strategy Reversion Number' : 'Best Short Strategy Trend Number')
            props[propName] = bestShort
        }
    }
    if (Object.keys(props).length === 0) {
        console.log('No values found for ' + name + ' in the Data Window.')
        return props
    }

    console.log('Set best strategy numbers:', props)
    await tv.setStrategyInputs(name, props, isDeepTest)

    if (isDeepTest) {
        await page.waitForTimeout(1000)
        let resultMsg = await tv.generateDeepTestReport()
        console.log('Deep Test Result::', resultMsg)
    }

    return props
}