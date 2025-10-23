const action = {}

action.testStrategy = async (request) => {
    console.log('Action.testStrategy:', request)
    global.reset()
    tv.reset()
    let header = []
    let testReport = []
    let equityList = []
    let failedTests = []
    let rfHtml = false
    let rfCsv = false
    let symbol = null
    let cyclesLength = 0
    let currentCycleCount = 0
    let failedSymbolExchanges = []

    try {
        global.timeout = request.options.timeout * 1000 //convert to ms
        let retry = request.options.retry
        let cycles = request.options.cycles
        cyclesLength = cycles.length
        let strategyProperties = request.options.strategyProperties
        global.iqIndicator = request.options.iqIndicator.trim()
        global.isNova = global.iqIndicator === NOVA
        global.isNovaTrend = request.options.isNovaTrendSelected
        global.isNovaReversion = request.options.isNovaReversionSelected

        global.isCS = global.iqIndicator === COUNTER_STRIKE
        rfHtml = request.options.reportResultOptions.html
        rfCsv = request.options.reportResultOptions.csv
        global.pfFilter = request.options.pfFilter //{long:0, short: 0, operator: [0: AND, 1: OR]}
        global.htmlEquityChartOnOff = request.options.reportResultOptions.htmlEquityChart
        global.testDateRangeType = request.options.testDateRangeType
        global.isDeepTest = global.testDateRangeType === CUSTOM_RANGE
        global.deepFrom = global.isDeepTest ? request.options.testDateRangeFrom : null
        global.deepTo = global.isDeepTest ? request.options.testDateRangeTo : null
        global.fileName = request.options.fileName
        if (!global.fileName || global.fileName === '') {
            global.fileName = global.iqIndicator
        }

        ui.statusMessage(STATUS_MSG)

        await initLegendObserver()
        await util.openDataWindow()
        await util.openStrategyTab()
        await util.verifyTimeFrame(request.options.requiredTimeframes)

        let iqWidget = await tvChart.enableStrategy(global.iqIndicator.replace(' Backtester [Trading IQ]', '').trim())
        if (!iqWidget) {
            await ui.showPopup(global.iqIndicator + ' could not be added. Please reload the page and try again.')
            return
        }

        if (request.options.resetAtStart) {
            await tv.resetStrategyInputs()
        }

        //Set strategy properties
        await tv.setStrategyProps(strategyProperties)

        await tv.loadCurrentBestStrategyNumbers()

        console.log('Action.testStrategy: iqIndicator:', global.iqIndicator, 'iqWidget:', iqWidget)
        await page.waitForTimeout(1000)
        for (const cycle of cycles) {
            if (!global.workerStatus) {
                console.log('Action.testStrategy: Stopped by User')
                break
            }

            let iqData = { strategyNumbers: {}, profitFactors: {} }
            let testResult = null
            let strategyParams = null
            global.currentCycle = cycle
            global.indicatorError = null
            global.isNovaReversionCycle = global.isNova && cycle[constants.novaIq_trade_reversions]
            global.isNovaTrendCycle = global.isNova && cycle[constants.novaIq_trade_trends]

            ui.statusMessage(STATUS_MSG, `Backtest ${++currentCycleCount} / ${cyclesLength}`)

            const symbolExchange = cycle.exchange
            if (symbolExchange !== 'NA') {
                let maxRetry = 3
                let symbolExchangeResult = null
                for (let i = 0; i < maxRetry; i++) {
                    symbolExchangeResult = await tv.setSymbolExchange(symbolExchange)
                    if (symbolExchangeResult === null) {
                        break
                    }
                    console.log('Action.testStrategy: Retrying to set symbol exchange:', symbolExchange, ',symbolExchangeResult:', symbolExchangeResult, 'attempt:', i + 1)
                }

                if (symbolExchangeResult !== null) {
                    failedSymbolExchanges.push(symbolExchange)
                    console.log(`Action.testStrategy: After 3 retries, the ${symbolExchange} could not be set. Please check the symbol exchange and try again.`)
                    continue
                }
            }

            global.cycleTf = cycle.tf === CURRENT_TF ? await tvChart.getCurrentTimeFrame() : cycle.tf
            if (cycle.tf !== CURRENT_TF) {
                await tvChart.changeTimeFrame(cycle.tf)
            } else {
                global.fileName = global.fileName.replace(/CURRENT_TF/g, global.cycleTf)
            }

            await tvChart.setTestDateRange();


            let testResults = {}
            testResults.isDeepTest = global.isDeepTest

            symbol = await util.getTickerExchange()
            iqData = await processCycle(iqWidget, retry, cycle)

            if (iqData === null) {
                // Only null if profit factors filter is not met
                continue
            }

            if (Object.keys(iqData.strategyNumbers).length === 0) {
                let failedCycle = { tf: global.cycleTf, iqData: iqData, testResult: testResult, strategyParams: strategyParams, symbolExchange: symbolExchange === 'NA' ? symbol : symbolExchange }
                console.log('Action.testStrategy: =======> No test result or strategy params found:', failedCycle)
                failedTests.push(failedCycle)
                continue
            }

            if (global.bestStrategyNumberCount === 0 && Object.keys(iqData.strategyNumbers).length > 0) {
                global.bestStrategyNumberCount = Object.keys(iqData.strategyNumbers).length
            }

            console.log('Action.testStrategy: iqData detected:', iqData, 'Get performance values')
            await page.waitForTimeout(1500)
            for (let i = 1; i <= retry; i++) {
                if (!global.workerStatus) {
                    console.log('Action.testStrategy: Stopped by User')
                    break
                }
                try {
                    await tvChart.updateReport();

                    testResult = await tv.getPerformance(testResults)
                    if (testResult.error?.msg) {
                        console.log('Action.testStrategy: Error getting performance:', testResult.error.msg)
                    }

                    for (var index = 0; index < 3; index++) {
                        strategyParams = await tv.getStrategyPropertyData(global.iqIndicator)

                        if (global.htmlEquityChartOnOff && testResult.data && strategyParams && testResult.data['Total trades: All'] + 1 !== strategyParams.EquityList?.length) {
                            console.log('Action.testStrategy: Unexpected equity data length: ' + (strategyParams.EquityList?.length || 'null') + ' expected: ' + testResult.data['Total trades: All'] + '. Please check the strategy settings.')
                            await page.waitForTimeout(500)
                            continue;
                        }
                        break;
                    }

                    if (testResult.data && strategyParams) {
                        break
                    }
                } catch (err) {
                    console.error('Action.testStrategy: Error getting performance:', err)
                }
            }

            if (global.workerStatus) {
                console.log('Action.testStrategy: testReport.length', testReport.length, 'testResult:', testResult, 'strategyParams:', strategyParams)
                if (!testResult.data || !strategyParams) {
                    let failedCycle = { tf: global.cycleTf, iqData: iqData, testResult: testResult, strategyParams: strategyParams, symbolExchange: symbolExchange === 'NA' ? symbol : symbolExchange }
                    console.log('Action.testStrategy: =======> No test result or strategy params found:', failedCycle)
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
                    header = reportUtil.createReportHeader(iqData, testResult, strategyParams)
                }

                testReport.push(reportUtil.createReport(global.cycleTf, iqData, testResult, strategyParams, symbolExchange === 'NA' ? symbol : symbolExchange))
            }
        }

        for (let failedCycle of failedTests) {
            console.log('Action.testStrategy: process failedCycle:', failedCycle)
            equityList.push([100])
            testReport.push(reportUtil.createReport(failedCycle.tf, failedCycle.iqData, failedCycle.testResult, failedCycle.strategyParams, failedCycle.symbolExchange))
        }

        ui.statusMessageRemove()
    } catch (err) {
        console.error(err)
        await ui.showPopup(`${err}`)
    }
    finally {
        if (!testReport || testReport.length === 0) {
            console.log('Action.testStrategy: No test report found: ', testReport)

            if (failedSymbolExchanges.length > 0) {
                const uniqueFailedSymbols = [...new Set(failedSymbolExchanges.map(symbol => symbol))];
                await ui.showPopup(`No test report result available.<br>The following symbols could not be set and were skipped: ${uniqueFailedSymbols.join(', ')}`);
            }
            if (global.pfFilter.enabled) {
                await ui.showPopup(`None of the test results met the profit factors filter (Long: ${JSON.stringify(global.pfFilter.long)}, Short: ${JSON.stringify(global.pfFilter.short)})`)
            } else {
                await ui.showPopup('No test report result available. Please check the strategy settings.')
            }
            return
        }
        if (rfHtml) {
            console.log('Action.testStrategy: create HTML report')
            const data = file.createHTML(header, testReport, equityList)
            file.saveAs(data, `${global.fileName}.html`)
        }
        if (rfCsv) {
            console.log('Action.testStrategy: create CSV report')
            const data = file.createCSV(header, testReport)
            file.saveAs(data, `${global.fileName}.csv`)
        }

        if (failedSymbolExchanges.length > 0) {
            const uniqueFailedSymbols = [...new Set(failedSymbolExchanges.map(symbol => symbol))];
            await ui.showPopup(`The following symbols could not be set and were skipped: ${uniqueFailedSymbols.join(', ')}`);
        }
    }
}

async function processCycle(iqWidget, retryCount, cycle) {
    console.log('Action.processCycle:', global.iqIndicator, 'isDeepTest', global.isDeepTest, 'cycle:', cycle)

    // TV changed the behavior: if the strategy parameters change, the best strategy numbers are not reset.
    // So we need to reset the strategy parameters before each cycle by changing the tf shortly.
    await tvChart.toggleTimeFrame()

    let iqData = []

    for (let i = 1; i <= retryCount; i++) {
        if (global.workerStatus === null) {
            break
        }

        global.indicatorError = null

        console.log('Action.processCycle:', i + '. try to get best strategy numbers for tf: ', global.cycleTf)
        iqData = await iqUtil.detectIqParameter(iqWidget, cycle)
        if (iqData === null) {
            return null
        }
        console.log('Action.processCycle:', i + '. detected best strategy numbers: ', iqData)
        if (Object.keys(iqData.strategyNumbers).length === 0) {
            //we will switch back and forth between previous and current timeframe. Sometimes it helps to get the values
            console.log('Action.processCycle:', i + '. try to get best strategy numbers failed for tf: ', global.cycleTf)
            await tvChart.toggleTimeFrame()
        } else {
            return iqData
        }
    }
    return []
}

async function initLegendObserver() {
    if (global.indicatorLegendStatus) {
        console.log('Action.initLegendObserver: already initialized')
        return;
    }
    console.log('Action.initLegendObserver: initializing')

    let legendContainer = document.querySelector(SEL.legendContainer)
    console.log('Action.initLegendObserver: legendContainer:', legendContainer)

    let legendSources = document.querySelectorAll(SEL.legendSources)
    if (legendSources.length === 0) {
        console.log('No legend sources found')
        return
    }

    let indicatorLegendItem = null
    for (let legendSource of legendSources) {
        if (legendSource.querySelector(SEL.legendSourceTitle)?.innerText.includes(global.iqIndicator)) {
            indicatorLegendItem = legendSource
            break
        }
    }
    if (!indicatorLegendItem) {
        console.log('Action.initLegendObserver: No indicator legend item found')
        return
    }

    console.log('indicatorLegendItem:', indicatorLegendItem)
    let valuesWrapper = indicatorLegendItem.querySelector('div[class^="valuesWrapper-"]')
    global.legendLoaderElement = indicatorLegendItem.querySelector(SEL.legendLoaderStatus)

    global.indicatorLegendStatus = indicatorLegendItem.querySelector(SEL.legendStatus)
    if (!global.indicatorLegendStatus) {
        console.log('Action.initLegendObserver: No legend status found')
        return
    }
    console.log('Action.initLegendObserver: global.indicatorLegendStatus:', global.indicatorLegendStatus)

    const legendStatusObserver = new MutationObserver(() => {
        if (global.indicatorLegendStatus.querySelector(SEL.legendStatusDataProblemLow)) {
            console.log('Action.initLegendObserver(legendStatusObserver): Data problem detected: Low data quality');
            global.indicatorError = 'Runtime error';
        } else {
            console.log('Action.initLegendObserver(legendStatusObserver): No data problem detected');
            global.indicatorError = null;
        }
    });
    legendStatusObserver.observe(global.indicatorLegendStatus, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
    console.log('Action.initLegendObserver: legendStatusObserver initialized')
}