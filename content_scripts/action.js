const action = {
    workerStatus: null,
    bestStrategyNumberCount: 0,
    previousBestStrategyNumbers: [],
    currentBestStrategyNumbers: [],
    testResultNumberCount: 0,
    strategyParamsNumberCount: 0,
    isDeepTest: false,
    deepFrom: null,
    deepTo: null,
    timeout: 60000
}

const STATUS_MSG = 'Do not change the window/tab.<br>If the Tradingview page is not in the foreground, the extension will not work.'

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
        action.isDeepTest = request.options.deeptest
        action.deepFrom = request.options.deepfrom
        action.deepTo = request.options.deepto

        ui.statusMessage(STATUS_MSG)

        await util.openDataWindow()
        await util.openStrategyTab()

        let iqWidget = await enableStrategy(iqIndicator.replace('tester [Trading IQ]', '').trim())
        if (!iqWidget) {
            await ui.showPopup(iqIndicator + ' could not be added. Please reload the page and try again.')
            return
        }

        if (request.options.resetAtStart) {
            await tv.resetStrategyInputs(iqIndicator)
        }

        //Set strategy properties
        await tv.setStrategyProps(iqIndicator, strategyProperties)

        await tv.loadCurrentBestStrategyNumbers()

        console.log('iqIndicator:', (!iqIndicator ? 'null' : iqIndicator), 'iqWidget:', iqWidget)
        await page.waitForTimeout(1000)

        let testReport = []
        let header = []
        let symbol = null
        let error = null
        let cyclesLength = cycles.length
        let currentCycle = 0
        for (const cycle of cycles) {
            if (!action.workerStatus) {
                console.log('Stopped by User')
                break
            }

            const symbolExchange = cycle.exchange
            if (symbolExchange !== 'NA') {
                const result = await tv.setSymbolExchange(symbolExchange)
                if (result !== null) {
                    await ui.showPopup(result)
                    return
                }
            }

            const cycleTf = cycle.tf === CURRENT_TF ? await tvChart.getCurrentTimeFrame() : cycle.tf
            ui.statusMessage(STATUS_MSG, `Backtest ${++currentCycle} / ${cyclesLength}`)
            if (cycle.tf !== CURRENT_TF) {
                await tvChart.changeTimeFrame(cycle.tf)
            }
            let deepCheckbox = document.querySelector(SEL.strategyDeepTestCheckbox)
            if (action.isDeepTest !== deepCheckbox.checked) {
                page.mouseClick(deepCheckbox)
                await page.waitForTimeout(1500)
            }

            if (action.isDeepTest) {
                console.log('Set deep test date range:', action.deepFrom, action.deepTo)
                let startDate = document.querySelector(SEL.strategyDeepTestStartDate)
                let endDate = document.querySelector(SEL.strategyDeepTestEndDate)
                if (startDate.value !== action.deepFrom) {
                    let msg = await tv.setDeepDateValues(startDate, action.deepFrom)
                    if (msg !== null) {
                        await ui.showPopup(msg)
                        return
                    }
                }
                if (endDate.value !== action.deepTo) {
                    let msg = await tv.setDeepDateValues(endDate, action.deepTo)
                    if (msg !== null) {
                        await ui.showPopup(msg)
                        return
                    }
                }
                let msg = await tv.generateDeepTestReport();
                console.log('Deep Test Result:', msg)

            }

            let testResults = {}
            testResults.isDeepTest = action.isDeepTest

            console.log('previousBestStrategyNumbers:', action.previousBestStrategyNumbers)
            let bestStrategyNumbers = await processCycle(iqIndicator, iqWidget, retry, cycle)
            if (Object.keys(bestStrategyNumbers).length === 0 && testReport.length === 0 && action.workerStatus) {
                await ui.showPopup('No best strategy numbers found after 5 attempts. Please try again later.')
                return
            }
            if (Object.keys(bestStrategyNumbers).length > 0) {
                action.previousBestStrategyNumbers = bestStrategyNumbers
            }
            if (action.bestStrategyNumberCount === 0) {
                action.bestStrategyNumberCount = Object.keys(bestStrategyNumbers).length
            }

            let testResult = null
            let strategyParams = null
            console.log('bestStrategyNumbers detected:', bestStrategyNumbers, 'Get performance values')
            for (let i = 1; i <= retry; i++) {
                if (action.workerStatus === null) {
                    console.log('Stopped by User')
                    break
                }

                testResult = await tv.getPerformance(testResults)
                if (testResult.error && testResult.error.msg) {
                    error = testResult.error.msg
                    break
                }

                strategyParams = await tv.getStrategyPropertyData(iqIndicator)

                if (testResult.data !== null || strategyParams !== null) {
                    break
                }
            }

            if (action.workerStatus) {
                if (testReport.length === 0 && (!testResult.data || !strategyParams)) {
                    console.log('No test result or strategy params found. Stop testing')
                    error = error ? error : 'Test results could not be found. Please try again again.'
                    break
                }

                if (strategyParams.Symbol) {
                    symbol = strategyParams.Symbol.replace(':', '-')
                }
                delete strategyParams['Symbol']

                if (testReport.length === 0) {
                    header = createReportHeader(bestStrategyNumbers, testResult, strategyParams)
                    testReport.push(header)
                }

                testReport.push(createReport(cycleTf, bestStrategyNumbers, testResult, strategyParams, symbolExchange === 'NA' ? symbol : symbolExchange))
            }
        }

        if (error) {
            await ui.showPopup(error)
            return
        }

        ui.statusMessageRemove()
        if (!testReport || testReport.length === 0) {
            return
        }
        if (rfHtml) {
            console.log('create HTML report')
            const data = file.createHTML(iqIndicator, testReport)
            file.saveAs(data, `${iqIndicator}.html`)
        }
        if (rfCsv) {
            console.log('create CSV report')
            const data = file.createCSV(iqIndicator, testReport)
            file.saveAs(data, `${iqIndicator}.csv`)
        }
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
}

async function processCycle(strategyName, iqWidget, retryCount, cycle) {
    console.log('processCycle:', strategyName, 'isDeepTest', action.isDeepTest, 'cycle:', cycle)

    // TV changed the behavior: if the strategy parameters change, the best strategy numbers are not reset.
    // So we need to reset the strategy parameters before each cycle by changing the tf shortly.
    const cycleTf = cycle.tf === CURRENT_TF ? await tvChart.getCurrentTimeFrame() : cycle.tf
    console.log('processCycle cycleTf:', cycleTf)
    let tf1 = "1m" === cycleTf ? "2m" : "1m"
    await tvChart.changeTimeFrame(tf1)
    await page.waitForTimeout(500)
    await tvChart.changeTimeFrame(cycleTf)
    await page.waitForTimeout(500)

    await page.waitForTimeout(100)
    for (let i = 1; i <= retryCount; i++) {
        if (action.workerStatus === null) {
            break
        }

        console.log(i + '. try to get best strategy numbers for tf: ', cycleTf)
        let bestStrategyNumbers = await detectBestStrategyNumbers(strategyName, iqWidget, cycle)
        console.log(i + '. detected best strategy numbers: ', bestStrategyNumbers)
        if (Object.keys(bestStrategyNumbers).length === 0) {
            //we will switch back and forth between previous and current timeframe. Sometimes it helps to get the values
            console.log(i + '. try to get best strategy numbers failed for tf: ', cycleTf)
            let tf1 = "1m" === cycleTf ? "2m" : "1m"
            await tvChart.changeTimeFrame(tf1)
            await page.waitForTimeout(1000)
            await tvChart.changeTimeFrame(cycleTf)
        } else {
            return bestStrategyNumbers
        }
    }
    return {}
}

function createReportHeader(bestStrategyNumbers, testResult, strategyParams) {
    let header = []
    header.push('Timeframe')
    header.push('Symbol')
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

function createReport(tf, bestStrategyNumbers, testResult, strategyParams, symbolExchange) {
    let report = []
    report.push(tf)
    report.push(symbolExchange)

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

async function getStrategyFromDataWindow(strategyName) {
    // Enable the strategy
    let dataWindowWidgetEl = document.querySelector(SEL.dataWindowWidget)
    let headers = dataWindowWidgetEl.querySelectorAll('span[class^="headerTitle-"]')
    let iqWidgetEl = null
    let firstEl = true
    for (let header of headers) {
        console.log('getStrategyFromDataWindow process header:', header.innerText)
        if (firstEl) {
            firstEl = false
            // Ticker - TF - Exchange eg: SOLUSDT.P · 5 · BITGET
            continue
        }
        if (header.innerText) {
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
async function enableStrategy(strategyName) {
    let iqWidgetEl = await getStrategyFromDataWindow(strategyName)

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
            iqWidgetEl = await getStrategyFromDataWindow(strategyName)
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

async function detectBestStrategyNumbers(name, iqWidget, cycle) {
    console.log('detectBestStrategyNumbers: ' + name)
    await util.openDataWindow()
    await util.openStrategyTab()

    let iqValues = []

    console.log('Set indicator parameter:', cycle)
    await tv.setStrategyInputs(name, cycle)
    if (action.isDeepTest) {
        await page.waitForTimeout(250)
        await tv.generateDeepTestReport()
    }

    let props = []
    let isNova = name === NOVA
    let maxTime = Date.now() + action.timeout
    while (Date.now() < maxTime) {
        console.log('waiting for ' + name + ' values')

        if (action.workerStatus === null) {
            break
        }

        await util.openDataWindow()
        await util.openStrategyTab()
        await page.waitForTimeout(500)
        iqValues = iqWidget.getElementsByClassName('item-_gbYDtbd')
        isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, 100)
        isProcessError = isProcessError || document.querySelector(SEL.strategyReportError)

        await util.switchToStrategySummaryTab()
        isProcessEnd = document.querySelector(SEL.strategyReportReady)
        props = getStrategyNumbers(iqValues, isNova);
        let propsLength = Object.keys(props).length

        // In case the Indicator settings changes, the best strategy numbers in the data window section are not reset.
        if (!isProcessError && util.equals(props, action.previousBestStrategyNumbers)) {
            continue
        }
        if (isProcessError || (propsLength > 0 && (isProcessEnd || !util.equals(props, action.currentBestStrategyNumbers)))) {
            console.log('Process is finished isProcessError:', isProcessError, 'isProcessEnd:', isProcessEnd, 'iqValues:', iqValues)
            console.log('Previous best strategy numbers:', action.previousBestStrategyNumbers)
            console.log('Current best strategy numbers:', action.currentBestStrategyNumbers)
            console.log('New best strategy numbers:', props)
            break
        }
    }

    if (Object.keys(props).length === 0) {
        console.log('No values found for ' + name + ' in the Data Window.')
        return props
    }

    console.log('Set best strategy numbers:', props)
    await tv.setStrategyInputs(name, props)

    if (action.isDeepTest) {
        await page.waitForTimeout(1000)
        let resultMsg = await tv.generateDeepTestReport()
        console.log('Deep Test Result::', resultMsg)
    }

    return props
}

function getStrategyNumbers(iqValues, isNova) {
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
    return props;
}

