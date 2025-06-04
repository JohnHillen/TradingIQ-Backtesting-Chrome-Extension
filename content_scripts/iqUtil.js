const iqUtil = {}

function getIqData(iqValues) {
    console.log('IQUtil.getIqData: iqValues:', Array.from(iqValues).map(el => el.outerHTML));
    let props = { strategyNumbers: {}, profitFactors: {} };
    for (let value of iqValues) {
        if (value.innerText.includes('Plot')) {
            continue;
        }
        let values = value.innerText.split('\n');
        console.log('IQUtil.getIqData: values:', values)
        // For some reason the \n is not always there, so we need to check for it.
        // What we expect is that the value ends with a number eg.: 'Best Long Strategy Number (Trend)205.000'
        if (values.length === 1) {
            const match = value.innerText.match(/^([^\d]*)(\d.*)$/);
            values = match ? [match[1], match[2]] : [value.innerText];
        }
        if (values.length >= 2) {
            if (values[0].includes('Long Strategy')) {
                let bestLong = parseInt(values[1].replace(/,/g, ''), 10);
                let propName = !global.isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Long Strategy Reversion Number' : 'Best Long Strategy Trend Number');
                props.strategyNumbers[propName] = isNaN(bestLong) ? 0 : bestLong;
            } else if (values[0].includes('Short Strategy')) {
                let bestShort = parseInt(values[1].replace(/,/g, ''), 10);
                let propName = !global.isNova ? values[0] : (values[0].includes('Reversion') ? 'Best Short Strategy Reversion Number' : 'Best Short Strategy Trend Number');
                props.strategyNumbers[propName] = isNaN(bestShort) ? 0 : bestShort;
            } else if (values[0].includes('PF')) { // Long PF or Short PF or for Impuls Longs PF or Shorts PF
                let pf = parseFloat(values[1].replace(/,/g, ''), 10);
                let propName = util.getProfitFactorKey(values[0]);
                let pfValue = isNaN(pf) ? 0 : pf;
                props.profitFactors[propName] = pfValue;
            }
        } else {
            console.warn('IQUtil.getIqData: Unexpected iqValue format:', value.innerText);
        }
    }
    return props;
}


iqUtil.detectIqParameter = async (iqWidget, cycle) => {
    console.log('IQUtil.detectIqParameter:', global.iqIndicator)
    await util.openDataWindow()
    await util.openStrategyTab()

    let iqValues = []

    console.log('IQUtil.detectIqParameter: Set indicator parameter:', cycle)
    await tv.setStrategyInputs(cycle)
    if (global.isDeepTest) {
        await page.waitForTimeout(250)
        await tv.generateDeepTestReport()
    }

    let props = { strategyNumbers: {}, profitFactors: {} };
    let maxTime = Date.now() + global.timeout
    let propSanityCounter = 0
    while (Date.now() < maxTime) {
        console.log('IQUtil.detectIqParameter: waiting for ' + global.iqIndicator + ' values')

        if (global.workerStatus === null) {
            break
        }

        await util.openDataWindow()
        await util.openStrategyTab()
        await page.waitForTimeout(600)
        iqValues = iqWidget.getElementsByClassName('item-_gbYDtbd')
        isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, 100)
        isProcessError = isProcessError || document.querySelector(SEL.strategyReportError) || global.indicatorError

        if (isProcessError) {
            console.log('IQUtil.detectIqParameter: Process is error:', isProcessError)
            props = { strategyNumbers: {}, profitFactors: {} };
            break
        }

        await util.switchToStrategySummaryTab()
        isProcessEnd = document.querySelector(SEL.strategyReportReady)
        if (!isProcessEnd) {
            console.log('IQUtil.detectIqParameter: Waiting for strategy report to be ready')
            continue;
        }

        let iqData = getIqData(iqValues); // contains strategy numbers and profit factors
        if (Object.keys(iqData.strategyNumbers).length === 0) {
            continue;
        }

        let propsLength = Object.keys(props).length
        if (JSON.stringify(iqData) !== JSON.stringify(props)) {
            props = iqData
            console.log('IQUtil.detectIqParameter: New strategy numbers:', props)
            continue;
        }

        if (++propSanityCounter < 3) {
            console.log('IQUtil.detectIqParameter: Waiting for strategy report to be ready propSanityCounter:', propSanityCounter)
            continue;
        }

        if (isProcessError || propsLength > 0) {
            console.log('IQUtil.detectIqParameter: Process is finished isProcessError:', isProcessError, 'isProcessEnd:', isProcessEnd, 'iqValues:', iqValues)
            console.log('IQUtil.detectIqParameter: New best strategy numbers:', props)
            if (global.isCS) {
                let csProps = iqUtil.getCSStopStypes(iqValues);
                console.log('IQUtil.detectIqParameter: CS Stop Types:', csProps)
                Object.assign(props, csProps)
            }
            break
        }
    }

    if (Object.keys(props).length === 0) {
        console.log('IQUtil.detectIqParameter: No values found for ' + global.iqIndicator + ' in the Data Window.')
        return props
    }

    // if profit factors filter enabled, check if the profit factors are above the filter values
    if (!iqUtil.profitFactorMet(props)) {
        console.log('IQUtil.detectIqParameter: Profit factors filter not met:', props.profitFactors, 'Filter:', global.pfFilter)
        return null
    }

    console.log('IQUtil.detectIqParameter: Set best strategy numbers:', props)
    await tv.setStrategyInputs(props.strategyNumbers)

    if (global.isCS) {
        delete props['Stop Type Long'];
        delete props['Stop Type Short'];
    }

    if (global.isDeepTest) {
        await page.waitForTimeout(1000)
        let resultMsg = await tv.generateDeepTestReport()
        console.log('IQUtil.detectIqParameter: Deep Test Result::', resultMsg)
    }

    return props
}


iqUtil.getCSStopStypes = (iqValues) => {
    console.log('IQUtil.getCSStopStypes: iqValues:', Array.from(iqValues).map(el => el.outerHTML));
    let props = {};
    for (let value of iqValues) {
        let values = value.innerText.split('\n');
        console.log('IQUtil.getCSStopStypes: values:', values)
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
            console.warn('IQUtil.getCSStopStypes: Unexpected iqValue format:', value.innerText);
        }
    }
    return props;
}

iqUtil.profitFactorMet = (iqData) => {
    if (!global.pfFilter.enabled) {
        return true
    }

    const checkProfitFactors = (pfLongKey, pfShortKey) => {
        let operator = global.pfFilter.operator || 0 // 0: AND, 1: OR
        let pfLong = iqData.profitFactors[pfLongKey];
        let pfShort = iqData.profitFactors[pfShortKey];
        let pfLongCheck = global.pfFilter.long === 0 || pfLong >= global.pfFilter.long;
        let pfShortCheck = global.pfFilter.short === 0 || pfShort >= global.pfFilter.short;
        return (operator === 0 && pfLongCheck && pfShortCheck) || (operator === 1 && (pfLongCheck || pfShortCheck));
    };

    if (global.isNova) {
        if (global.isNovaTrendCycle && checkProfitFactors(NOVA_TREND_LONG_PF, NOVA_TREND_SHORT_PF)) {
            return true;
        }
        if (global.isNovaReversionCycle && checkProfitFactors(NOVA_REVERSION_LONG_PF, NOVA_REVERSION_SHORT_PF)) {
            return true;
        }
    } else if (checkProfitFactors(LONG_PF, SHORT_PF)) {
        return true;
    }
    return false
}