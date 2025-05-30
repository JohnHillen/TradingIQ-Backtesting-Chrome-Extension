const reportUtil = {}

reportUtil.createReportHeader = (iqData, testResult, strategyParams) => {
    let header = []
    header.push('Timeframe')
    header.push('Symbol')
    for (let key in iqData.strategyNumbers) {
        header.push(key)
    }

    if (global.isNova) {
        header.push(NOVA_REVERSION_LONG_PF)
        header.push(NOVA_REVERSION_SHORT_PF)
        header.push(NOVA_TREND_LONG_PF)
        header.push(NOVA_TREND_SHORT_PF)
    } else {
        header.push(LONG_PF)
        header.push(SHORT_PF)
    }

    global.testResultNumberCount = Object.keys(testResult.data).length
    for (let key in testResult.data) {
        header.push(key)
    }

    global.strategyParamsNumberCount = Object.keys(strategyParams).length
    for (let key in strategyParams) {
        header.push(key)
    }
    return header
}

reportUtil.createReport = (tf, iqData, testResult, strategyParams, symbolExchange) => {
    let report = []
    report.push(tf)
    report.push(symbolExchange)

    let bestStrategyNumbers = iqData.strategyNumbers || []
    for (let i = 0; i < global.bestStrategyNumberCount; i++) {
        if (i < Object.keys(bestStrategyNumbers).length) {
            let key = Object.keys(bestStrategyNumbers)[i]
            report.push(bestStrategyNumbers[key])
        } else {
            report.push('NA')
        }
    }

    if (global.isNova) {
        report.push(iqData.profitFactors[NOVA_REVERSION_LONG_PF] || 'NA')
        report.push(iqData.profitFactors[NOVA_REVERSION_SHORT_PF] || 'NA')
        report.push(iqData.profitFactors[NOVA_TREND_LONG_PF] || 'NA')
        report.push(iqData.profitFactors[NOVA_TREND_SHORT_PF] || 'NA')
    } else {
        report.push(iqData.profitFactors[LONG_PF] || 'NA')
        report.push(iqData.profitFactors[SHORT_PF] || 'NA')
    }


    for (let i = 0; i < global.testResultNumberCount; i++) {
        if (testResult && testResult.data && i < Object.keys(testResult.data).length) {
            let key = Object.keys(testResult.data)[i]
            report.push(testResult.data[key])
        } else {
            report.push('NA')
        }
    }


    for (let i = 0; i < global.strategyParamsNumberCount; i++) {
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