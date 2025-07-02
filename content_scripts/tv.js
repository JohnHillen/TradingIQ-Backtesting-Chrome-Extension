const tv = {
  reportNode: null,
  tickerTextPrev: null,
  timeFrameTextPrev: null,
  isReportChanged: false
}
tv.isParsed = false

tv.reset = () => {
  tv.reportNode = null
  tv.tickerTextPrev = null
  tv.timeFrameTextPrev = null
  tv.isReportChanged = false
  tv.isParsed = false
}

tv.setStrategyProps = async (props) => {
  console.log('TV.setStrategyProps', global.iqIndicator, props, global.isDeepTest)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(false)
  if (!indicatorTitleEl)
    return null
  const strategyProperties = document.querySelectorAll(SEL.indicatorPropertyContent)
  const propKeys = Object.keys(props)
  let setResultNumber = 0
  let setPropertiesNames = {}
  for (let i = 0; i < strategyProperties.length; i++) {
    const propText = strategyProperties[i].innerText
    if (propText && propKeys.includes(propText)) {
      setPropertiesNames[propText] = true
      setResultNumber++
      const propClassName = strategyProperties[i].getAttribute('class')
      if (propClassName.includes('first-')) {
        i++
        if (strategyProperties[i].querySelector('input')) {
          let value = props[propText]
          if (value.hasOwnProperty('value1')) {
            page.setInputElementValue(strategyProperties[i].querySelector('input'), value.value1)

            if (strategyProperties[i].querySelector('span[role="button"]')) { // List
              if (propText.toLowerCase().includes('order size') && value.value2 === 'Base Currency') {
                await setSelectBySelector(strategyProperties[i], '[id*=cash_per_order]')
              } else {
                await setSelectValue(strategyProperties[i], value.value2)
              }
            }
          } else {
            page.setInputElementValue(strategyProperties[i].querySelector('input'), props[propText])
          }
        } else if (strategyProperties[i].querySelector('span[role="button"]')) { // List
          await setSelectValue(strategyProperties[i], props[propText])
        }
      } else if (propClassName.includes('fill-') || propClassName.includes('checkboxItem-')) {
        const checkboxEl = strategyProperties[i].querySelector('input[type="checkbox"]')
        if (checkboxEl) {
          const isChecked = Boolean(checkboxEl.checked)
          if (Boolean(props[propText]) !== isChecked) {
            page.mouseClick(checkboxEl)
            checkboxEl.checked = Boolean(props[propText])
          }
        }
      }
      setResultNumber = Object.keys(setPropertiesNames).length
      if (propKeys.length === setResultNumber)
        break
    }
  }
  if (document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
  return true
}

async function setSelectValue(strategyProperties, value) {
  const buttonEl = strategyProperties.querySelector('span[role="button"]')
  if (!buttonEl || !buttonEl.innerText)
    return
  buttonEl.scrollIntoView()
  await page.waitForTimeout(150)
  page.mouseClick(buttonEl)
  await page.waitForTimeout(140)
  page.setSelByText(SEL.strategyListOptions, value)
  await page.waitForTimeout(156)
}
async function setSelectBySelector(strategyProperties, selector) {
  const buttonEl = strategyProperties.querySelector('span[role="button"]')
  if (!buttonEl || !buttonEl.innerText)
    return
  buttonEl.scrollIntoView()
  await page.waitForTimeout(150)
  page.mouseClick(buttonEl)
  await page.waitForTimeout(140)
  await page.waitForMouseClickSelector(selector, 156)
}
tv.resetStrategyInputs = async () => {
  console.log('TV.resetStrategyInputs', global.iqIndicator)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(true)
  if (!indicatorTitleEl)
    return

  page.mouseClickSelector(SEL.strategyDefaultElement)
  await page.waitForTimeout(50)
  page.setSelByText(SEL.strategyDefaultElementList, 'Reset settings')
  await page.waitForTimeout(150)

  if (document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
}

tv.setStrategyInputs = async (propVal) => {
  console.log('TV.setStrategyInputs', global.iqIndicator, propVal)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(true)
  if (!indicatorTitleEl)
    return null
  const indicProperties = document.querySelectorAll(SEL.indicatorPropertyContent)
  const propKeys = Object.keys(propVal)
  let setResultNumber = 0
  let ignoredPropKeys = ['tf', 'exchange']
  let propKeysProcessed = []
  if (propKeys.includes(ignoredPropKeys[0]) || propKeys.includes(ignoredPropKeys[1])) {
    propKeysProcessed = ignoredPropKeys
  }
  let propKeyProcessed = false
  for (let i = 0; i < indicProperties.length; i++) {
    propKeyProcessed = false
    const propText = indicProperties[i].innerText.trim()
    if (propText && propKeys.includes(propText)) {
      setResultNumber++
      const propClassName = indicProperties[i].getAttribute('class')
      if (propClassName.includes('first-')) {
        i++
        if (indicProperties[i].querySelector('input')) {
          page.setInputElementValue(indicProperties[i].querySelector('input'), propVal[propText])
          propKeyProcessed = true
        } else if (indicProperties[i].querySelector('span[role="button"]')) { // List
          const buttonEl = indicProperties[i].querySelector('span[role="button"]')
          if (!buttonEl || !buttonEl.innerText)
            continue
          buttonEl.scrollIntoView()
          await page.waitForTimeout(350)
          page.mouseClick(buttonEl)
          await page.waitForTimeout(340)
          let textToSet = propVal[propText]
          if (TIMEFRAME_PROPERTIES.includes(propText)) {
            textToSet = util.convertToTimeframe(textToSet)
          }
          page.setSelByText(SEL.strategyListOptions, textToSet)
          await page.waitForTimeout(356)
          propKeyProcessed = true
        }
      } else if (propClassName.includes('fill-')) {
        const checkboxEl = indicProperties[i].querySelector('input[type="checkbox"]')
        if (checkboxEl) {
          const isChecked = Boolean(checkboxEl.checked)
          /*                                                 _
             Ugly solution because the value2 has no label: |_| Use R Multiple (R:R) ' ' <input>
             value1 - checkbox value, value2 - input value
          */
          if (propVal[propText].hasOwnProperty('adaptive') && propText === 'Use R Multiple (R:R)') {
            if (Boolean(propVal[propText].value1) !== isChecked) {
              page.mouseClick(checkboxEl)
              checkboxEl.checked = Boolean(propVal[propText].value1)
            }
            i += 2;
            if (indicProperties[i].querySelector('input')) {
              page.setInputElementValue(indicProperties[i].querySelector('input'), propVal[propText].value2)
            }
          }
          else if (Boolean(propVal[propText]) !== isChecked) {
            page.mouseClick(checkboxEl)
            checkboxEl.checked = Boolean(propVal[propText])
          }
          propKeyProcessed = true
        }
      }
    }
    if (propKeyProcessed) {
      propKeysProcessed.push(propText)
    }
    if (propKeys.length === Object.keys(propKeysProcessed).length) {
      console.log('TV.setStrategyInputs all properties set')
      break
    }
  }

  let propKeysNotFound = propKeys.filter(key => !propKeysProcessed.includes(key) && !ignoredPropKeys.includes(key.toLowerCase()))
  console.log('TV.setStrategyInputs propKeys.length', propKeys.length, 'propKeysNotFound:', propKeysNotFound)
  // TODO check if not equal propKeys.length === setResultNumber, because there is none of changes too. So calculation doesn't start
  if (propKeys.length !== Object.keys(propKeysProcessed).length) {
    throw new Error(`Not all strategy inputs were set. Set: ${Object.keys(propKeysProcessed).length}, expected: ${propKeys.length}. Not found: ${propKeysNotFound.join(', ')}`)
  }
  if (document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
  return true
}

tv.openCurrentStrategy = async (isInputTab) => {
  let selTab = isInputTab ? SEL.tabInput : SEL.tabProperties
  let selActiveTab = isInputTab ? SEL.tabInputActive : SEL.tabPropertiesActive
  let tab = isInputTab ? 'input' : 'properties'

  let stratParamEl = document.querySelector(SEL.strategyCaption)
  if (!stratParamEl) {
    await ui.showPopup('There is not strategy param button on the strategy tab. Test stopped. Open correct page please')
    return null
  }
  stratParamEl.click()

  await page.waitForMouseClickSelector(SEL.strategyPropertiesBtn)

  const stratIndicatorEl = await page.waitForSelector(SEL.indicatorTitle, 2000)
  if (!stratIndicatorEl) {
    await ui.showPopup('There is not strategy parameters. Test stopped. Open correct page please')
    return null
  }
  const tabEl = document.querySelector(selTab)
  if (!tabEl) {
    await ui.showPopup(`There is not strategy parameters ${tab} tab. Test stopped. Open correct page please`)
    return null
  }
  tabEl.click()
  const tabActiveEl = await page.waitForSelector(selActiveTab)
  if (!tabActiveEl) {
    await ui.showPopup(`There is not strategy parameters active ${tab} tab. Test stopped. Open correct page please`)
    return null
  }
  return true
}

tv.checkAndOpenStrategy = async (isInputTab) => {
  let indicatorTitleEl = document.querySelector(SEL.indicatorTitle)
  if (!indicatorTitleEl || indicatorTitleEl.innerText !== global.iqIndicator) {
    try {
      await tv.switchToStrategyTab()
    } catch (e) {
      console.error('TV.switchToStrategyTab error', e)
      return null
    }
    if (!await tv.openCurrentStrategy(isInputTab))
      return null
    indicatorTitleEl = await page.waitForSelector(SEL.indicatorTitle, 2000)
    if (!indicatorTitleEl || indicatorTitleEl.innerText !== global.iqIndicator) {
      await ui.showPopup(`The ${global.iqIndicator} strategy parameters could not opened. ${indicatorTitleEl.innerText ? 'Opened "' + indicatorTitleEl.innerText + '".' : ''} Reload the page, leave one strategy on the chart and try again.`)
      return null
    }
  }
  return indicatorTitleEl
}

tv.openStrategyTab = async () => {
  let isStrategyActiveEl = await page.waitForSelector(SEL.strategyTesterTabActive)
  if (!isStrategyActiveEl) {
    const strategyTabEl = await page.waitForSelector(SEL.strategyTesterTab)
    if (strategyTabEl) {
      strategyTabEl.click()
      await page.waitForSelector(SEL.strategyTesterTabActive)
      await page.waitForTimeout(500)
    } else {
      throw new Error('There is not "Strategy Tester" tab on the page. Reload the page and try again.')
    }
  }
  return true
}

tv.switchToStrategyTab = async () => {
  await tv.openStrategyTab()
  const testResults = {}

  testResults.ticker = await tvChart.getTicker()
  testResults.timeFrame = await tvChart.getCurrentTimeFrame()

  let strategyCaptionEl = document.querySelector(SEL.strategyCaption)
  if (!strategyCaptionEl) {
    throw new Error('There is not strategy name element on "Strategy Tester" tab.')
  }
  testResults.name = strategyCaptionEl.getAttribute('data-strategy-title') //strategyCaptionEl.innerText

  await util.switchToStrategySummaryTab()

  await page.waitForSelector(SEL.strategyReportObserveArea, 10000)

  console.log('TV.reportNode', tv.reportNode)
  if (!tv.reportNode) {
    tv.reportNode = await page.waitForSelector(SEL.strategyReportObserveArea, 10000)
    if (tv.reportNode) {
      const reportObserver = new MutationObserver(() => {
        tv.isReportChanged = true
      });
      console.log('TV. set reportObserver')
      reportObserver.observe(tv.reportNode, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    } else {
      throw new Error('The strategy report did not found.')
    }
  }
  return testResults
}

tv.parseReportTable = async (baseCurrency = null) => {
  await util.openStrategyTab()
  await page.waitForTimeout(1000)

  let currency = baseCurrency
  const strategyHeaders = []
  const selHeader = SEL.strategyReportHeader
  const selRow = SEL.strategyReportRow
  await page.waitForSelector(selHeader, 10000)
  let allHeadersEl = document.querySelectorAll(selHeader)
  if (!allHeadersEl || allHeadersEl.length === 0) {
    await page.waitForSelector(selHeader, 10000)
    allHeadersEl = document.querySelectorAll(selHeader)
  }

  if (!allHeadersEl || !(allHeadersEl.length === 4 || allHeadersEl.length === 5)) { // 5 - Extra column for full screen
    if (!tv.isParsed)
      throw new Error('Can\'t get performance headers.')
    else {
      console.error('TV. Can\'t get performance headers.')
      return null
    }
  }
  for (let headerEl of allHeadersEl) {
    if (headerEl)
      strategyHeaders.push(headerEl.innerText)
  }

  const report = {}
  await page.waitForSelector(selRow, 10000)
  let allReportRowsEl = document.querySelectorAll(selRow)
  if (!allReportRowsEl || allReportRowsEl.length === 0) {
    await page.waitForSelector(selHeader, 10000)
    allReportRowsEl = document.querySelectorAll(selRow)
  }
  if (!allReportRowsEl || allReportRowsEl.length === 0) {
    if (!tv.isParsed)
      throw new Error('Can\'t get performance rows.')
  } else {
    tv.isParsed = true
  }
  for (let rowEl of allReportRowsEl) {
    if (rowEl) {
      const allTdEl = rowEl.querySelectorAll('td')
      if (!allTdEl || allTdEl.length < 2 || !allTdEl[0]) {
        continue
      }
      let paramName = allTdEl[0].innerText
      let isSingleValue = allTdEl.length === 3 || HEADER_SINGLE.includes(paramName.toLowerCase())
      let hasPercentValue = allTdEl.length === 3 || HEADER_PERCENT.includes(paramName.toLowerCase())
      let unit = paramName.toLowerCase().includes('percent') ? ' (%)' : ''
      for (let i = 1; i < allTdEl.length; i++) {
        if (isSingleValue && i >= 2)
          continue
        let values = allTdEl[i].innerText

        const isNegative = allTdEl[i].querySelector('[class^="negativeValue"]') && !['avg losing trade', 'largest losing trade', 'gross loss', 'max run-up', 'max drawdown'].includes(paramName.toLowerCase())
        if (values && typeof values === 'string' && strategyHeaders[i]) {
          values = values.replaceAll(' ', ' ').replaceAll('−', '-').trim()
          if (currency === null) {
            const valueParts = values.split('\n');
            if (valueParts.length === 3) {
              currency = valueParts[1];
            }
          }

          if (currency !== null && values.includes(currency)) {
            unit = ` (${currency})`
          }

          const digitalValues = values.replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '')
          let digitOfValues = digitalValues.match(/-?\d+\.?\d*/)
          let nameDigits = isSingleValue ? `${paramName}${unit}` : `${paramName}${unit}: ${strategyHeaders[i]}`
          const namePercents = isSingleValue ? `${paramName} (%)` : `${paramName} (%): ${strategyHeaders[i]}`
          if ((values.includes('\n') && values.endsWith('%'))) {
            const countNewLines = (str) => (str.match(/\n/g) || []).length + 1;
            const newLineCount = countNewLines(values);
            const valuesPair = values.split('\n', newLineCount)
            if (valuesPair && valuesPair.length === newLineCount) {
              const digitVal0 = valuesPair[0].replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '') //.match(/-?\d+\.?\d*/)
              const digitVal1 = valuesPair[newLineCount - 1].replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '') //match(/-?\d+\.?\d*/)

              report[nameDigits] = nameDigits.includes('Trades') ? parseInt(digitVal0) : parseFloat(digitVal0)
              if (report[nameDigits] > 0 && isNegative)
                report[nameDigits] = report[nameDigits] * -1

              report[namePercents] = namePercents.includes('Trades') ? parseInt(digitVal1) : parseFloat(digitVal1)
              if (report[namePercents] > 0 && isNegative)
                report[namePercents] = report[namePercents] * -1
            }
          } else if (Boolean(digitOfValues)) {
            report[nameDigits] = nameDigits.includes('Trades') ? parseInt(digitalValues) : parseFloat(digitalValues)
            if (report[nameDigits] > 0 && isNegative)
              report[nameDigits] = report[nameDigits] * -1
          } else {
            report[nameDigits] = values
            if (hasPercentValue) {
              report[namePercents] = 'N/A'
            }
          }
        }
      }
    }
  }
  return report.length === 0 ? null : { data: report, baseCurrency: currency }
}

tv.generateDeepTestReport = async () => {
  const generateBtnEl = await page.waitForSelector(SEL.strategyDeepTestGenerateBtn)
  if (generateBtnEl) {
    page.mouseClick(generateBtnEl)
    await page.waitForTimeout(150)
  } else if (page.$(SEL.strategyDeepTestGenerateBtnDisabled)) {
    return 'Deep backtesting process is not started'
  } else {
    return 'somethging else'
  }
  return ''
}

tv.getPerformance = async (testResults) => {
  let reportData = null
  let message = ''
  let isProcessError = null
  let baseCurrency = null
  console.log('TV. getPerformance isDeepTest: ', testResults.isDeepTest)
  if (testResults.isDeepTest) {
    message = await tv.generateDeepTestReport() //testResults.dataLoadingTime * 2000)
  }

  let isProcessEnd = tv.isReportChanged
  let endTime = new Date().getTime() + global.timeout
  while (Date.now() < endTime) {
    isProcessError = await getBacktestingErrors()
    if (isProcessError.msg) {
      if (await tryToFixBacktestingError(isProcessError)) {
        continue
      } else {
        console.log('TV. break by isProcessError', isProcessError)
        break
      }
    }
    isProcessEnd = await page.waitForSelector(SEL.strategyReportReady, 500)
    console.log('TV. Waiting for report data isProcessError msg: ' + isProcessError.msg + ', canBeFixed: ' + isProcessError.canBeFixed + ', isProcessEnd: ' + isProcessEnd)
    if (isProcessError.msg || isProcessEnd) {
      console.log('TV. break by isProcessError', isProcessError, 'isProcessEnd', isProcessEnd)
      break
    }
  }

  await page.waitForTimeout(250)

  if ((!isProcessError || !isProcessError.msg) && isProcessEnd) {
    try {
      await util.switchToStrategySummaryTab()
      let result = await tv.parseReportTable()
      reportData = result.data
      baseCurrency = result.baseCurrency
      await util.switchToStrategyTradesAnalysisTab()
      result = await tv.parseReportTable(baseCurrency)
      for (let key in result.data) {
        reportData[key] = result.data[key]
      }
      await util.switchToStrategyRatioTab()
      result = await tv.parseReportTable(baseCurrency)
      for (let key in result.data) {
        reportData[key] = result.data[key]
      }
      console.log('TV. Report data ready:', reportData)
    } catch (e) {
      console.error('TV.getPerformance error:', e)
    }
  }

  console.log('TV. isProcessError', isProcessError, 'isProcessEnd', isProcessEnd, 'message', message, 'reportData', reportData)
  return { error: isProcessError, message: message, data: reportData, currency: baseCurrency }
}

async function getBacktestingErrors() {
  if (global.workerStatus === null) {
    console.log('TV. Worker is stopped')
    return { msg: 'Stopped by user', canBeFixed: false }
  }

  if (global.indicatorError) {
    return { msg: global.indicatorError, canBeFixed: true }
  }

  let errorMsg = null
  let canBeFixed = true
  let noDataError = await page.waitForSelector(SEL.strategyReportError, 200)
  if (noDataError) {
    let errorContainer = await page.waitForSelector(SEL.backtestingWarningContainer, 200)
    errorMsg = !errorContainer ? null : await page.waitForSelectorInnerText(SEL.backtestingWarningContainerInformerBody, 200)
  }

  if (!errorMsg) {
    return { msg: errorMsg, canBeFixed: canBeFixed }
  }

  // Knonw messages:
  // - Calculation timed out. Remove the indicator and reapply it to the chart
  // - Error on bar 100000: Array is too large. Maximum size is 100000.
  // - Deep Backtesting trades only appear in the Strategy Tester tab and are not shown on the chart.
  if (errorMsg.includes('Deep Backtesting trades only appear in')) {
    return { msg: null, canBeFixed: true }
  }

  if (errorMsg.includes('Array is too large') && global.isDeepTest) {
    errorMsg += ' Try to reduce the date range for deep test.'
    canBeFixed = false
  }

  return { msg: errorMsg, canBeFixed: canBeFixed }
}

async function tryToFixBacktestingError(error) {
  console.log('TV.tryToFixBacktestingError', error)
  if (!error.canBeFixed) {
    return false
  }

  await tvChart.toggleTimeFrame()

  return true
}

tv.getStrategyPropertyData = async (name) => {
  console.log('TV.getStrategyPropertyData', global.isDeepTest, global.deepFrom, global.deepTo, name)
  let result = {}
  try {
    console.log('TV.getStrategyPropertyDataNew get strategy data range')
    await util.switchToStrategyTradesTab()
    await page.waitForTimeout(500)
    let allHeadersEl = document.querySelectorAll(SEL.strategyReportHeader)
    if (!allHeadersEl || allHeadersEl.length === 0) {
      return result
    }
    let emptyCoulmnCounter = 0
    let dateIndex, cumulativeProfitIndex = -1
    for (let i = 0; i < allHeadersEl.length; i++) {
      if (allHeadersEl[i].innerText.includes("Date")) {
        dateIndex = i + 1
      } else if (allHeadersEl[i].innerText === "") {
        emptyCoulmnCounter++
      } else if (cumulativeProfitIndex === -1 && allHeadersEl[i].innerText.toLowerCase().includes("cumulative p&l")) {
        cumulativeProfitIndex = i + 1
      }
    }
    if (dateIndex === undefined) {
      return result
    }

    let table = await page.waitForSelector(SEL.strategyReportTable, 100)
    let rows = await page.waitForSelectorAll(SEL.strategyReportRow, 100)

    if (!table || !rows || rows.length === 0) {
      result['Trading range (yyyy-mm-dd)'] = 'NA - NA'
      result['Backtesting range (yyyy-mm-dd)'] = 'NA - NA'
    } else {
      let to = rows[0].querySelector(`td:nth-child(${dateIndex}) div[class^="cell-"][data-part="0"]`).innerText
      let toFormatted = new Date(to).toISOString().split('T')[0]
      let maxTradeId = parseInt(rows[0].querySelector(`td:nth-child(1)`).innerText)

      await util.scrollToBottom(table)

      rows = await page.waitForSelectorAll(SEL.strategyReportRow, 100)
      let from = rows[rows.length - 1].querySelector(`td:nth-child(${dateIndex}) div[class^="cell-"][data-part="1"]`).innerText
      let fromFormatted = new Date(from).toISOString().split('T')[0]

      result['Trading range (yyyy-mm-dd)'] = fromFormatted + ' - ' + toFormatted
      if (global.isDeepTest) {
        fromFormatted = new Date(global.deepFrom).toISOString().split('T')[0]
        toFormatted = new Date(global.deepTo).toISOString().split('T')[0]
      }
      result['Backtesting range (yyyy-mm-dd)'] = fromFormatted + ' - ' + toFormatted

      if (global.htmlEquityChartOnOff) {
        let equityData = await getEqutiyData(table, cumulativeProfitIndex, maxTradeId)
        result['EquityList'] = equityData
      } else {
        result['EquityList'] = null
      }
    }

    console.log('TV.getStrategyPropertyDataNew get strategy symbol info')
    result['Symbol'] = await util.getTickerExchange()

    console.log('TV.getStrategyPropertyDataNew get strategy inputs')
    await tv.openCurrentStrategy(true)
    let inputs = await tv.getStrategyParams()
    for (let key in inputs) {
      if (!key.includes("Short Strategy ") && !key.includes("Long Strategy "))
        result[key] = inputs[key]
    }
    await util.closeStrategyPropertyDialog()

    console.log('TV.getStrategyPropertyDataNew get strategy properties')
    await tv.openCurrentStrategy(false)
    let props = await tv.getStrategyParams()
    for (let key in props) {
      result[key] = props[key]
    }
    await util.closeStrategyPropertyDialog()

  } catch (e) {
    console.error('TV.getStrategyPropertyDataNew error:', e)
    return null
  }
  return result
}

async function getEqutiyData(table, cumulativeProfitIndex, maxTradeId = 1) {
  console.log('TV.getEqutiyData', cumulativeProfitIndex, maxTradeId)
  if (!table) {
    return null
  }
  let equityData = []
  equityData.push(100) // equity starts always from 100%
  let currentEquity = 100.0
  let rows = null
  let tradeId = 0
  while (tradeId < maxTradeId) {
    rows = await page.waitForSelectorAll(SEL.strategyReportRow, 100)
    if (!rows || rows.length === 0) {
      console.log('TV. WARNING: getEqutiyData rows not found')
      return equityData
    }

    for (let i = rows.length - 1; i >= 0; i--) {
      let id = parseInt(rows[i].querySelector(`td:nth-child(1)`).innerText)
      if (id <= tradeId) {
        continue
      }
      if (id > tradeId + 1) {
        console.log('TV. WARNING: getEqutiyData tradeId skipped:', tradeId, 'id:', id, 'row:', rows[i]);
      }

      tradeId = id
      let profit = rows[i].querySelector(`td:nth-child(${cumulativeProfitIndex}) div[class^="percentValue-"]`).innerText
      if (!profit || !profit.endsWith('%')) {
        console.log('TV. WARNING: getEqutiyData profit not found:', profit, 'row:', rows[i])
        return equityData
      }
      profit = profit.replace(/−/, '-')
      currentEquity += parseFloat(profit)
      currentEquity = parseFloat(currentEquity.toFixed(2))
      equityData.push(currentEquity)
      console.log('TV.getEqutiyData profit:', profit, 'tradeId:', tradeId, 'equity:', currentEquity, 'equityData.length:', equityData.length)
    }

    table.scrollTop -= 400;
    await page.waitForTimeout(15)

  }
  return equityData
}

tv.setDeepDateValues = async (dateElement, dateValue) => {
  const date = new Date(dateValue)
  let year = date.getFullYear()
  let month = date.getMonth()
  let day = date.getDate()

  page.mouseClick(dateElement)
  await page.waitForTimeout(56)

  page.mouseClickSelector(SEL.datePickerSwitchToMonth)
  await page.waitForTimeout(59)

  page.mouseClickSelector(SEL.datePickerSwitchToYears)
  await page.waitForTimeout(52)

  let outOfRange = false
  let buttons = document.querySelectorAll(SEL.datePickerDecadesButtons)
  for (let button of buttons) {
    if (outOfRange || button.innerText === year.toString()) {
      if (button.disabled) {
        console.log('TV. Deep Backtesting year is out of range: ' + year + ' (' + dateValue + ')')
        outOfRange = true
        continue
      }
      page.mouseClick(button)
      await page.waitForTimeout(52)
      break
    }
  }
  outOfRange = false
  buttons = document.querySelectorAll(SEL.datePickerMonthButtons)
  for (i = 0; i < 12; i++) {
    if (outOfRange || i === month) {
      if (buttons[i].disabled) {
        console.log('TV. Deep Backtesting month is out of range: ' + MONTHS[month] + ' (' + dateValue + ')');
        outOfRange = true
        continue
      }
      page.mouseClick(buttons[i])
      await page.waitForTimeout(52)
      break
    }
  }

  outOfRange = false
  buttons = document.querySelectorAll(SEL.datePickerDaysButtons)
  for (let button of buttons) {
    if (outOfRange || button.innerText === day.toString()) {
      if (button.disabled) {
        console.log('TV. Deep Backtesting day is out of range: ' + day + ' (' + dateValue + ')');
        outOfRange = true
        continue
      }
      page.mouseClick(button)
      await page.waitForTimeout(52)
      break
    }
  }
}

tv.loadCurrentBestStrategyNumbers = async () => {
  console.log('TV.loadCurrentStrategy')
  let strategyParams = await tv.getStrategyParams();
  for (let key in strategyParams) {
    if (key.toLocaleLowerCase().includes('strategy number')) {
      global.currentBestStrategyNumbers[key] = strategyParams[key]
    }
  }
}

tv.getStrategyParams = async () => {
  const strategyInputs = {}
  const indicProperties = document.querySelectorAll(SEL.indicatorPropertyContent)
  for (let i = 0; i < indicProperties.length; i++) {
    const propClassName = indicProperties[i].getAttribute('class')
    const propText = indicProperties[i].innerText
    if (!propClassName || !propText) // Undefined type of element
      continue
    if (propClassName.includes('first-') && indicProperties[i].innerText) {
      i++
      if (indicProperties[i].querySelector('div[class^="inputGroup"')) {
        const dateElement = indicProperties[i].querySelector('div[class^="inputGroup"')
        let propValue = util.parseInputValue(dateElement);

        const listValue = util.parseSelectValue(indicProperties[i]);
        if (listValue)
          propValue += ' ' + listValue

        if (propValue)
          strategyInputs[propText] = propValue
      }
      else if (indicProperties[i] && indicProperties[i].querySelector('input')) {
        strategyInputs[propText] = util.parseInputValue(indicProperties[i]);
      } else if (indicProperties[i].querySelector('span[role="button"]')) { // List
        const listValue = util.parseSelectValue(indicProperties[i]);
        if (listValue)
          strategyInputs[propText] = listValue
      } else { // Undefined
        console.log('TV.getStrategyParams 1 skipped:', propText)
        continue
      }
    } else if (propClassName.includes('fill-') || propClassName.includes('checkboxItem-')) {
      const element = indicProperties[i].querySelector('input[type="checkbox"]')
      if (element) {
        strategyInputs[propText] = element.getAttribute('checked') !== null ? element.checked : false

        /*                                                 _
           Ugly solution because the value2 has no label: |_| Use R Multiple (R:R) ' ' <input>
           value1 - checkbox value, value2 - input value
        */
        if (propText === 'Use R Multiple (R:R)') {
          i += 2;
          if (indicProperties[i].querySelector('input')) {
            let propValue = indicProperties[i].querySelector('input').value
            strategyInputs['R:R'] = parseFloat(propValue) == parseInt(propValue) ? parseInt(propValue) : parseFloat(propValue)
          }
        }
      } else { // Undefined type of element
        console.log('TV.getStrategyParams 2 skipped:', propText)
        continue
      }
    } else if (propClassName.includes('titleWrap-')) { // Titles bwtwen parameters
      continue
    } else { // Undefined type of element
      console.log('getStrategyParams 3 skipped:', propText)
      continue
    }
  }
  return strategyInputs
}

tv.setSymbolExchange = async (symbolExchange) => {
  console.log('TV.setSymbolExchange', symbolExchange)
  const symbolInfoEl = await page.waitForSelector(SEL.symbolSearchBtn, 1000)
  if (!symbolInfoEl) {
    return 'Symbol search button not found'
  }

  await page.waitForMouseClickSelector(SEL.symbolSearchBtn)
  const symbolInfoDialogEl = await page.waitForSelector(SEL.symbolSearchDialog, 1000)
  if (!symbolInfoDialogEl) {
    return 'Symbol search dialog not found'
  }

  await page.waitForTimeout(500)
  const symbolInputEl = await page.waitForSelector(SEL.symbolSearchInput, 1000)
  if (!symbolInputEl) {
    return 'Symbol search input not found'
  }
  await page.waitForTimeout(500)
  page.setInputElementValue(symbolInputEl, symbolExchange)
  await page.waitForTimeout(1500)

  const searchSymbolListEl = await page.waitForSelector(SEL.symbolSearchList, 1000)
  if (!searchSymbolListEl) {
    return 'Symbol search list not found'
  }
  const symbolEl = await page.waitForSelector(SEL.symbolSearchFirstItem, 3000)
  if (!symbolEl) {
    return 'Symbol search first item not found'
  }
  let firstItemExchangeEl = await page.waitForSelector(SEL.symbolSearchFirstItemExchange, 1000)
  let firstItemSymbolEl = symbolEl.querySelector('div[class^="symbolTitle"]');
  console.log('TV. firstItemSymbolEl', firstItemSymbolEl)

  if (!firstItemExchangeEl || !firstItemSymbolEl) {
    return 'Symbol search first item exchange or symbol not found'
  }

  let exchangeText = symbolExchange.split(':')[0]
  if (!firstItemExchangeEl?.innerText.toUpperCase().endsWith(exchangeText.toUpperCase())) {
    console.log('TV. unexpected exchange text expected:', exchangeText, 'actual:', firstItemExchangeEl?.innerText)
    return 'unexpected exchange text expected: ' + exchangeText + ' actual: ' + firstItemExchangeEl
  }

  let symbolText = symbolExchange.split(':')[1]
  if (symbolText !== firstItemSymbolEl?.innerText) {
    console.log('TV. unexpected symbol text expected:', symbolText, 'actual:', firstItemSymbolEl?.innerText)
    return 'unexpected symbol text expected: ' + symbolText + ' actual: ' + firstItemSymbolEl
  }

  page.mouseClick(symbolEl)
  await page.waitForTimeout(150)

  return null
}

