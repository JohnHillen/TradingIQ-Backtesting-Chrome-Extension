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
    cycleTf: null,
    indicatorLegendStatus: null,
    indicatorError: null,
    timeout: 60000,
    fileName: null
}

const STATUS_MSG = `
Do not change the window/tab.<br>
If the Tradingview page is not in the foreground, the extension will not work.<br>

</i>
`;

function resetAction() {
    action.bestStrategyNumberCount = 0
    action.previousBestStrategyNumbers = []
    action.currentBestStrategyNumbers = []
    action.testResultNumberCount = 0
    action.strategyParamsNumberCount = 0
    action.htmlEquityChartOnOff = false
    action.isDeepTest = false
    action.deepFrom = null
    action.deepTo = null
    action.cycleTf = null
    action.indicatorLegendStatus = null
    action.indicatorError = null
    action.timeout = 60000,
        action.fileName = null
}

action.testStrategy = async (request) => {
    console.log('action.testStrategy: ', request)
    resetAction()
    tv.reset()
    let header = []
    let testReport = []
    let equityList = []
    let failedTests = []
    let iqIndicator = ''
    let rfHtml = false
    let rfCsv = false
    let symbol = null
    let cyclesLength = 0
    let currentCycle = 0

    try {
        action.timeout = request.options.timeout * 1000 //convert to ms
        let retry = request.options.retry
        let cycles = request.options.cycles
        cyclesLength = cycles.length
        let strategyProperties = request.options.strategyProperties
        iqIndicator = request.options.iqIndicator
        rfHtml = request.options.reportResultOptions.html
        rfCsv = request.options.reportResultOptions.csv
        htmlEquityChartOnOff = request.options.reportResultOptions.htmlEquityChartOnOff
        action.isDeepTest = request.options.deeptest
        action.deepFrom = request.options.deepfrom
        action.deepTo = request.options.deepto
        action.fileName = request.options.fileName
        if (!action.fileName || action.fileName === '') {
            action.fileName = iqIndicator.trim()
        }

        ui.statusMessage(STATUS_MSG)

        await initLegendObserver(iqIndicator)
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

        for (const cycle of cycles) {
            if (!action.workerStatus) {
                console.log('Stopped by User')
                break
            }

            action.indicatorError = null

            const symbolExchange = cycle.exchange
            if (symbolExchange !== 'NA') {
                let maxRetry = 3
                let symbolExchangeResult = null
                for (let i = 0; i < maxRetry; i++) {
                    symbolExchangeResult = await tv.setSymbolExchange(symbolExchange)
                    if (symbolExchangeResult === null) {
                        break
                    }
                    console.log('Retrying to set symbol exchange:', symbolExchange, 'attempt:', i + 1)
                }

                if (symbolExchangeResult !== null) {
                    console.log('Failed to set symbol exchange:', symbolExchangeResult)
                    await ui.showPopup(result)
                    return
                }
            }

            action.cycleTf = cycle.tf === CURRENT_TF ? await tvChart.getCurrentTimeFrame() : cycle.tf
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
                if (action.deepFrom > endDate.value) {
                    if (endDate.value !== action.deepTo) {
                        await tv.setDeepDateValues(endDate, action.deepTo)
                    }
                    if (startDate.value !== action.deepFrom) {
                        await tv.setDeepDateValues(startDate, action.deepFrom)
                    }
                }
                else {
                    if (startDate.value !== action.deepFrom) {
                        await tv.setDeepDateValues(startDate, action.deepFrom)
                    }
                    if (endDate.value !== action.deepTo) {
                        await tv.setDeepDateValues(endDate, action.deepTo)
                    }
                }
                let msg = await tv.generateDeepTestReport();
                console.log('Deep Test Result:', msg)

            }

            let testResults = {}
            testResults.isDeepTest = action.isDeepTest

            let tickerName = await tvChart.getTicker()
            console.log('tickerName:', tickerName, 'cycleTf:', action.cycleTf)
            symbol = await util.getTickerExchange()

            let bestStrategyNumbers = []
            let testResult = null
            let strategyParams = null

            console.log('previousBestStrategyNumbers:', action.previousBestStrategyNumbers)
            bestStrategyNumbers = await processCycle(iqIndicator, iqWidget, retry, cycle, tickerName)
            if (Object.keys(bestStrategyNumbers).length === 0) {
                let failedCycle = { tf: action.cycleTf, bestStrategyNumbers: bestStrategyNumbers, testResult: testResult, strategyParams: strategyParams, symbolExchange: symbolExchange === 'NA' ? symbol : symbolExchange }
                console.log('=======> No test result or strategy params found:', failedCycle)
                failedTests.push(failedCycle)
                continue
            }
            if (Object.keys(bestStrategyNumbers).length > 0) {
                action.previousBestStrategyNumbers.push(bestStrategyNumbers)
            }
            if (action.bestStrategyNumberCount === 0 && Object.keys(bestStrategyNumbers).length > 0) {
                action.bestStrategyNumberCount = Object.keys(bestStrategyNumbers).length
            }

            console.log('bestStrategyNumbers detected:', bestStrategyNumbers, 'Get performance values')
            await page.waitForTimeout(1500)
            for (let i = 1; i <= retry; i++) {
                if (action.workerStatus === null) {
                    console.log('Stopped by User')
                    break
                }
                try {
                    testResult = await tv.getPerformance(testResults)
                    if (testResult.error && testResult.error.msg) {
                        console.log('Error getting performance:', testResult.error.msg)
                    }

                    strategyParams = await tv.getStrategyPropertyData(iqIndicator)

                    if (testResult.data && strategyParams) {
                        break
                    }
                } catch (err) {
                    console.error('Error getting performance:', err)
                }
            }

            if (action.workerStatus) {
                console.log('testReport.length', testReport.length, 'testResult:', testResult, 'strategyParams:', strategyParams)
                if (!testResult.data || !strategyParams) {
                    let failedCycle = { tf: action.cycleTf, bestStrategyNumbers: bestStrategyNumbers, testResult: testResult, strategyParams: strategyParams, symbolExchange: symbolExchange === 'NA' ? symbol : symbolExchange }
                    console.log('=======> No test result or strategy params found:', failedCycle)
                    failedTests.push(failedCycle)
                    continue
                }
                delete strategyParams['Symbol']

                if (strategyParams.EquityList) {
                    equityList.push(strategyParams.EquityList)
                    delete strategyParams['EquityList']
                } else {
                    equityList.push([100])
                }

                if (header.length === 0 && testResult.data && strategyParams) {
                    header = createReportHeader(bestStrategyNumbers, testResult, strategyParams)
                }

                testReport.push(createReport(action.cycleTf, bestStrategyNumbers, testResult, strategyParams, symbolExchange === 'NA' ? symbol : symbolExchange))
            }
        }

        for (let failedCycle of failedTests) {
            equityList.push([100])
            testReport.push(createReport(failedCycle.tf, failedCycle.bestStrategyNumbers, failedCycle.testResult, failedCycle.strategyParams, failedCycle.symbolExchange))
        }

        ui.statusMessageRemove()
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
    finally {
        if (!testReport || testReport.length === 0) {
            console.log('No test report found: ', testReport)
            return
        }
        if (rfHtml) {
            console.log('create HTML report')
            const data = file.createHTML(iqIndicator, header, testReport, equityList)
            file.saveAs(data, `${action.fileName}.html`)
        }
        if (rfCsv) {
            console.log('create CSV report')
            const data = file.createCSV(iqIndicator, header, testReport)
            file.saveAs(data, `${action.fileName}.csv`)
        }
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
    await page.waitForTimeout(1500)
    await tvChart.changeTimeFrame(cycleTf)
    await page.waitForTimeout(1500)

    let bestStrategyNumbers = []

    for (let i = 1; i <= retryCount; i++) {
        if (action.workerStatus === null) {
            break
        }

        action.indicatorError = null

        console.log(i + '. try to get best strategy numbers for tf: ', cycleTf)
        bestStrategyNumbers = await detectIqParameter(strategyName, iqWidget, cycle)
        console.log(i + '. detected best strategy numbers: ', bestStrategyNumbers)
        if (Object.keys(bestStrategyNumbers).length === 0) {
            //we will switch back and forth between previous and current timeframe. Sometimes it helps to get the values
            console.log(i + '. try to get best strategy numbers failed for tf: ', cycleTf)
            let tf1 = "1m" === cycleTf ? "2m" : "1m"
            await tvChart.changeTimeFrame(tf1)
            await page.waitForTimeout(1500)
            await tvChart.changeTimeFrame(cycleTf)
            await page.waitForTimeout(1500)
        } else {
            return bestStrategyNumbers
        }
    }
    return []
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

    for (let i = 0; i < action.testResultNumberCount; i++) {
        if (testResult && testResult.data && i < Object.keys(testResult.data).length) {
            let key = Object.keys(testResult.data)[i]
            report.push(testResult.data[key])
        } else {
            report.push('NA')
        }
    }


    for (let i = 0; i < action.strategyParamsNumberCount; i++) {
        if (strategyParams && i < Object.keys(strategyParams).length) {
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
        while (true) {
            await page.waitForTimeout(500)
            indicatorList = document.querySelectorAll(SEL.indicatorsDialogContentList)
            if (indicatorList) {
                for (let item of indicatorList) {
                    if (item.innerText.includes(strategyName)) {
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

async function detectIqParameter(name, iqWidget, cycle) {
    console.log('DetectIqParameter:', name)
    console.log('DetectIqParameter: previousBestStrategyNumbers:', action.previousBestStrategyNumbers)
    await util.openDataWindow()
    await util.openStrategyTab()

    let iqValues = []

    console.log('DetectIqParameter: Set indicator parameter:', cycle)
    await tv.setStrategyInputs(name, cycle)
    if (action.isDeepTest) {
        await page.waitForTimeout(250)
        await tv.generateDeepTestReport()
    }

    let props = []
    let isNova = name === NOVA
    let isCS = name === COUNTER_STRIKE
    let maxTime = Date.now() + action.timeout
    let propSanityCounter = 0
    while (Date.now() < maxTime) {
        console.log('DetectIqParameter: waiting for ' + name + ' values')

        if (action.workerStatus === null) {
            break
        }

        await util.openDataWindow()
        await util.openStrategyTab()
        await page.waitForTimeout(1000)
        iqValues = iqWidget.getElementsByClassName('item-_gbYDtbd')
        isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, 100)
        isProcessError = isProcessError || document.querySelector(SEL.strategyReportError) || action.indicatorError

        if (isProcessError) {
            console.log('DetectIqParameter: Process is error:', isProcessError)
            props = []
            break
        }

        await util.switchToStrategySummaryTab()
        isProcessEnd = document.querySelector(SEL.strategyReportReady)
        if (!isProcessEnd) {
            console.log('DetectIqParameter: Waiting for strategy report to be ready')
            continue;
        }

        let strategyNumbers = getStrategyNumbers(iqValues, isNova);
        let strategyNumbersLength = Object.keys(strategyNumbers).length
        if (strategyNumbersLength === 0) {
            continue;
        }

        let propsLength = Object.keys(props).length
        if (JSON.stringify(strategyNumbers) !== JSON.stringify(props)) {
            props = strategyNumbers
            console.log('DetectIqParameter: New strategy numbers:', props)
            continue;
        }

        if (propSanityCounter++ <= 3) {
            console.log('DetectIqParameter: Waiting for strategy report to be ready propSanityCounter:', propSanityCounter)
            continue;
        }

        if (isProcessError || propsLength > 0) {
            console.log('DetectIqParameter: Process is finished isProcessError:', isProcessError, 'isProcessEnd:', isProcessEnd, 'iqValues:', iqValues)
            console.log('DetectIqParameter: Previous best strategy numbers:', action.previousBestStrategyNumbers)
            console.log('DetectIqParameter: New best strategy numbers:', props)
            if (isCS) {
                let csProps = getCSStopStypes(iqValues);
                console.log('DetectIqParameter: CS Stop Types:', csProps)
                Object.assign(props, csProps)
            }
            break
        }

        function containsPreviousBestStrategyNumbers(props) {
            return action.previousBestStrategyNumbers.some(previousProps => {
                const propsEntries = Object.entries(props).sort();
                const previousPropsEntries = Object.entries(previousProps).sort();
                return JSON.stringify(propsEntries) === JSON.stringify(previousPropsEntries);
            });
        }
    }

    if (Object.keys(props).length === 0) {
        console.log('DetectIqParameter: No values found for ' + name + ' in the Data Window.')
        return props
    }

    console.log('DetectIqParameter: Set best strategy numbers:', props)
    await tv.setStrategyInputs(name, props)

    if (isCS) {
        delete props['Stop Type Long'];
        delete props['Stop Type Short'];
    }

    if (action.isDeepTest) {
        await page.waitForTimeout(1000)
        let resultMsg = await tv.generateDeepTestReport()
        console.log('DetectIqParameter: Deep Test Result::', resultMsg)
    }

    return props
}

function getStrategyNumbers(iqValues, isNova) {
    console.log('getStrategyNumbers iqValues:', Array.from(iqValues).map(el => el.outerHTML));
    let props = {};
    for (let value of iqValues) {
        let values = value.innerText.split('\n');
        console.log('getStrategyNumbers values:', values)
        if (values.length >= 2) {
            if (values[0].includes('Long Strategy')) {
                let bestLong = parseInt(values[1].replace(/,/g, ''), 10);
                let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Long Strategy Reversion Number' : 'Best Long Strategy Trend Number');
                props[propName] = isNaN(bestLong) ? 0 : bestLong;
            } else if (values[0].includes('Short Strategy')) {
                let bestShort = parseInt(values[1].replace(/,/g, ''), 10);
                let propName = !isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Short Strategy Reversion Number' : 'Best Short Strategy Trend Number');
                props[propName] = isNaN(bestShort) ? 0 : bestShort;
            }
        } else {
            console.warn('Unexpected iqValue format:', value.innerText);
        }
    }
    return props;
}

function getCSStopStypes(iqValues) {
    console.log('getStrategyNumbers iqValues:', Array.from(iqValues).map(el => el.outerHTML));
    let props = {};
    for (let value of iqValues) {
        let values = value.innerText.split('\n');
        console.log('getStrategyNumbers values:', values)
        if (values.length >= 2) {
            // 1 == Trailing Stop, -1 == Fixed Stop
            if (values[0].includes('Stop Type Long')) {
                let longType = parseFloat(values[1].replace(/,/g, '').replace('−', '-'), 10);
                let propName = 'Stop Type Long';
                props[propName] = isNaN(longType) ? 0 : longType === 1 ? 'Trailing Stop' : 'Fixed Stop';
            } else if (values[0].includes('Stop Type Short')) {
                let shortType = parseFloat(values[1].replace(/,/g, '').replace('−', '-'), 10);
                let propName = 'Stop Type Short';
                props[propName] = isNaN(shortType) ? 0 : shortType === 1 ? 'Trailing Stop' : 'Fixed Stop';
            }
        } else {
            console.warn('Unexpected iqValue format:', value.innerText);
        }
    }
    return props;
}

async function initLegendObserver(iqIndicator) {
    if (action.indicatorLegendStatus) {
        console.log('initLegendObserver already initialized')
        return;
    }
    console.log('initLegendObserver')

    let legendContainer = document.querySelector(SEL.legendContainer)
    console.log('legendContainer:', legendContainer)

    let legendSources = document.querySelectorAll(SEL.legendSources)
    if (legendSources.length === 0) {
        console.log('No legend sources found')
        return
    }

    let indicatorLegendItem = null
    for (let legendSource of legendSources) {
        if (legendSource.innerText && legendSource.innerText.includes(iqIndicator)) {
            indicatorLegendItem = legendSource
            break
        }
    }
    if (!indicatorLegendItem) {
        console.log('No indicator legend item found')
        return
    }

    console.log('indicatorLegendItem:', indicatorLegendItem)

    action.indicatorLegendStatus = indicatorLegendItem.querySelector(SEL.legendStatus)
    if (!action.indicatorLegendStatus) {
        console.log('No legend status found')
        return
    }

    const legendStatusObserver = new MutationObserver(() => {
        if (action.indicatorLegendStatus.querySelector('div[class*="dataProblemLow"]')) {
            console.log('Data problem detected: Low data quality');
            action.indicatorError = 'Runtime error';
        } else {
            action.indicatorError = null;
        }
    });

    legendStatusObserver.observe(action.indicatorLegendStatus, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    console.log('initLegendObserver initialized')
}