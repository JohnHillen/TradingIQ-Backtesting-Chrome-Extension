const tv = {
  reportNode: null,
  reportDeepNode: null,
  tickerTextPrev: null,
  timeFrameTextPrev: null,
  isReportChanged: false
}
tv.isParsed = false

tv.setStrategyProps = async (name, props, isDeepTest) => {
  console.log('setStrategyProps', name, props, isDeepTest)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(name, false, isDeepTest)
  if (!indicatorTitleEl)
    return null
  const strategyProperties = document.querySelectorAll(sw.indicatorPropertyContent())
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
              await setSelectValue(strategyProperties[i], value.value2)
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
tv.resetStrategyInputs = async (name, isDeepTest) => {
  console.log('resetStrategyInputs', name)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(name, true, isDeepTest)
  if (!indicatorTitleEl)
    return

  page.mouseClickSelector(SEL.strategyDefaultElement)
  await page.waitForTimeout(50)
  page.setSelByText(SEL.strategyDefaultElementList, 'Reset settings')
  await page.waitForTimeout(150)

  if (document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
}

tv.setStrategyInputs = async (name, propVal, isDeepTest) => {
  console.log('setStrategyInputs', name, propVal)
  const indicatorTitleEl = await tv.checkAndOpenStrategy(name, true, isDeepTest)
  if (!indicatorTitleEl)
    return null
  const indicProperties = document.querySelectorAll(SEL.indicatorPropertyContent)
  const propKeys = Object.keys(propVal)
  let setResultNumber = 0
  let setPropertiesNames = {}
  for (let i = 0; i < indicProperties.length; i++) {
    const propText = indicProperties[i].innerText
    if (propText && propKeys.includes(propText)) {
      setPropertiesNames[propText] = true
      setResultNumber++
      const propClassName = indicProperties[i].getAttribute('class')
      if (propClassName.includes('first-')) {
        i++
        if (indicProperties[i].querySelector('input')) {
          page.setInputElementValue(indicProperties[i].querySelector('input'), propVal[propText])
        } else if (indicProperties[i].querySelector('span[role="button"]')) { // List
          const buttonEl = indicProperties[i].querySelector('span[role="button"]')
          if (!buttonEl || !buttonEl.innerText)
            continue
          buttonEl.scrollIntoView()
          await page.waitForTimeout(350)
          page.mouseClick(buttonEl)
          await page.waitForTimeout(340)
          page.setSelByText(SEL.strategyListOptions, propVal[propText])
          await page.waitForTimeout(356)
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
        }
      }
      setResultNumber = Object.keys(setPropertiesNames).length
      if (propKeys.length === setResultNumber)
        break
    }
  }
  // TODO check if not equal propKeys.length === setResultNumber, because there is none of changes too. So calculation doesn't start
  if (document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
  return true
}

tv.openCurrentStrategy = async (isInputTab) => {
  let selTab = isInputTab ? SEL.tabInput : SEL.tabProperties
  let selActiveTab = isInputTab ? SEL.tabInputActive : SEL.tabPropertiesActive
  let tab = isInputTab ? 'input' : 'properties'

  let stratParamEl = document.querySelector(sw.strategyDialogParam())
  if (!stratParamEl) {
    await ui.showPopup('There is not strategy param button on the strategy tab. Test stopped. Open correct page please')
    return null
  }
  stratParamEl.click()

  if (sw.newStrategyView) {
    await page.waitForMouseClickSelector(SEL2.strategyPropertiesBtn)
  }

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

tv.checkAndOpenStrategy = async (name, isInputTab, isDeepTest) => {
  let indicatorTitleEl = document.querySelector(SEL.indicatorTitle)
  if (!indicatorTitleEl || indicatorTitleEl.innerText !== name) {
    try {
      await tv.switchToStrategyTab(isDeepTest)
    } catch (e) {
      console.error('tv.switchToStrategyTab error', e)
      return null
    }
    if (!await tv.openCurrentStrategy(isInputTab))
      return null
    indicatorTitleEl = await page.waitForSelector(SEL.indicatorTitle, 2000)
    if (!indicatorTitleEl || indicatorTitleEl.innerText !== name) {
      await ui.showPopup(`The ${name} strategy parameters could not opened. ${indicatorTitleEl.innerText ? 'Opened "' + indicatorTitleEl.innerText + '".' : ''} Reload the page, leave one strategy on the chart and try again.`)
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

tv.switchToStrategyTab = async (isDeepTest) => {
  await tv.openStrategyTab()
  const testResults = {}

  testResults.ticker = await tvChart.getTicker()
  testResults.timeFrame = await tvChart.getCurrentTimeFrame()

  let strategyCaptionEl = document.querySelector(SEL.strategyCaption) // 2023-02-24 Changed to more complicated logic - for single and multiple strategies in page
  // strategyCaptionEl = !strategyCaptionEl ? document.querySelector(SEL.strategyCaptionNew) : strategyCaptionEl // From 2022-11-13
  if (!strategyCaptionEl) { // || !strategyCaptionEl.innerText) {
    throw new Error('There is not strategy name element on "Strategy Tester" tab.')
  }
  testResults.name = strategyCaptionEl.getAttribute('data-strategy-title') //strategyCaptionEl.innerText


  await util.switchToStrategySummaryTab(isDeepTest)

  await page.waitForSelector(sw.strategyReportObserveArea(), 10000)

  console.log('tv.reportNode', tv.reportNode)
  if (!tv.reportNode) {
    // tv.reportNode = await page.waitForSelector(SEL.strategyReport, 10000)
    tv.reportNode = await page.waitForSelector(sw.strategyReportObserveArea(), 10000)
    if (tv.reportNode) {
      const reportObserver = new MutationObserver(() => {
        tv.isReportChanged = true
      });
      console.log('SET DEEP TEST OBSERVE AREA')
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

  console.log('tv.reportDeepNode', tv.reportDeepNode)
  if (!tv.reportDeepNode) {
    tv.reportDeepNode = await page.waitForSelector(sw.strategyReportDeepTestObserveArea(), 5000)
    if (tv.reportDeepNode) {
      const reportObserver = new MutationObserver(() => {
        tv.isReportChanged = true
      });
      reportObserver.observe(tv.reportDeepNode, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    } else {
      console.error('The strategy deep report did not found.')
    }
  }
  return testResults
}

tv.parseReportTable = async (isDeepTest, baseCurrency = null) => {
  await util.openStrategyTab()

  let currency = baseCurrency
  const strategyHeaders = []
  const selHeader = isDeepTest ? sw.strategyReportDeepTestHeader() : sw.strategyReportHeader()
  const selRow = isDeepTest ? sw.strategyReportDeepTestRow() : sw.strategyReportRow()
  await page.waitForSelector(selHeader, 2500)

  let allHeadersEl = document.querySelectorAll(selHeader)
  if (!allHeadersEl || !(allHeadersEl.length === 4 || allHeadersEl.length === 5)) { // 5 - Extra column for full screen
    if (!tv.isParsed)
      throw new Error('Can\'t get performance headers.')
    else {
      console.error('Can\'t get performance headers.')
      return null
    }
  }
  for (let headerEl of allHeadersEl) {
    if (headerEl)
      strategyHeaders.push(headerEl.innerText)
  }

  const report = {}
  await page.waitForSelector(selRow, 2500)
  let allReportRowsEl = document.querySelectorAll(selRow)
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
      for (let i = 1; i < allTdEl.length; i++) {
        if (isSingleValue && i >= 2)
          continue
        let values = allTdEl[i].innerText

        const isNegative = allTdEl[i].querySelector('[class^="negativeValue"]') && !['avg losing trade', 'largest losing trade', 'gross loss', 'max run-up', 'max drawdown'].includes(paramName.toLowerCase())
        if (values && typeof values === 'string' && strategyHeaders[i]) {
          values = values.replaceAll(' ', ' ').replaceAll('−', '-').trim()
          if (sw.newStrategyView && paramName.toLowerCase() === 'net profit') {
            const valueParts = values.split('\n');
            if (valueParts.length === 3) {
              currency = valueParts[1];
            }
          }
          const digitalValues = values.replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '')
          let digitOfValues = digitalValues.match(/-?\d+\.?\d*/)
          let nameDigits = isSingleValue ? paramName : `${paramName}: ${strategyHeaders[i]}`
          const namePercents = isSingleValue ? `${paramName} %` : `${paramName} %: ${strategyHeaders[i]}`
          if (sw.newStrategyView && currency && values.includes(currency)) {
            nameDigits += ` (${currency})`
          }
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
    await page.waitForTimeout(65)
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
  let selProgress = testResults.isDeepTest ? sw.strategyReportDeepTestInProcess() : sw.strategyReportInProcess()
  let selReady = testResults.isDeepTest ? sw.strategyReportDeepTestReady() : sw.strategyReportReady()
  console.log('getPerformance isDeepTest: ', testResults.isDeepTest)
  if (testResults.isDeepTest) {
    message = await tv.generateDeepTestReport() //testResults.dataLoadingTime * 2000)
  }

  let isProcessStart = await page.waitForSelector(selProgress, 2500)
  let isProcessEnd = tv.isReportChanged
  console.log('getPerformance: isProcessStart', isProcessStart, 'isProcessEnd', isProcessEnd)
  if (isProcessStart) {
    const tick = 1000
    //isProcessEnd = await page.waitForSelector(selReady, dataWaitingTime)
    for (let i = 0; i < action.timeout / tick; i++) {
      if (action.workerStatus === null) {
        console.log('Worker is stopped')
        isProcessError = true
        break
      }
      isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, 100)
      if (!isProcessError) {
        isProcessError = await page.waitForSelector(sw.strategyReportError(), 100)
      }
      //isProcessEnd = await page.waitForSelector(selReady, dataWaitingTime)
      isProcessEnd = document.querySelector(selReady)
      console.log('Waiting for report data isProcessError ' + isProcessError + ' isProcessEnd ' + isProcessEnd)
      if (isProcessError || isProcessEnd) {
        console.log('break by isProcessError', isProcessError, 'isProcessEnd', isProcessEnd)
        break
      }
      if (!sw.newStrategyView && (tick * i) % 5000 === 0) {
        console.log('Switch between StrategyTester and ScriptEditor tabs')
        await util.openPineEditorTab()
        await page.waitForTimeout(500)
        await util.openStrategyTab()
        await page.waitForTimeout(250)
      }
    }
  } else if (isProcessEnd) {
    isProcessStart = true
  }

  isProcessError = isProcessError || document.querySelector(sw.strategyReportError())
  await page.waitForTimeout(250) // Waiting for update digits. 150 is enough but 250 for reliable TODO Another way?

  if (!isProcessError && isProcessEnd) {
    await util.switchToStrategySummaryTab(testResults.isDeepTest)
    let result = await tv.parseReportTable(testResults.isDeepTest)
    reportData = result.data
    baseCurrency = result.baseCurrency
    if (sw.newStrategyView) {
      await util.switchToStrategyTradesAnalysisTab(testResults.isDeepTest)
      result = await tv.parseReportTable(testResults.isDeepTest, baseCurrency)
      for (let key in result.data) {
        reportData[key] = result.data[key]
      }
      await util.switchToStrategyRatioTab(testResults.isDeepTest)
      result = await tv.parseReportTable(testResults.isDeepTest, baseCurrency)
      for (let key in result.data) {
        reportData[key] = result.data[key]
      }
    }
    console.log('Report data ready:', reportData)
  }

  console.log('isProcessError', isProcessError, 'isProcessStart', isProcessStart, 'isProcessEnd', isProcessEnd, 'message', message, 'reportData', reportData)
  return { error: isProcessError ? 2 : !isProcessStart ? 1 : !isProcessEnd ? 3 : null, message: message, data: reportData, currency: baseCurrency }
}

tv.getStrategyPropertyData = async (isDeepTest, deepfrom, deepto, name) => {
  if (sw.newStrategyView)
    return await getStrategyPropertyDataNew(isDeepTest, deepfrom, deepto, name)
  else
    return await getStrategyPropertyDataOld()
}

function getText(child) {
  if (!child)
    return ""
  let text = child.innerText.trim().replaceAll(',', '')
  text = text.endsWith(':') ? text.slice(0, text.length - 1) : text
  return text
}

// For old strategy tester view
async function getStrategyPropertyDataOld() {
  console.log('getStrategyPropertyDataOld')
  let result = {}
  try {
    console.log('getStrategyPropertyDataOld get strategy data range')
    page.mouseClickSelector(SEL.strategyProperties)
    await page.waitForSelector(SEL.strategyPropertiesDataRange, 100)
    let dataRangeEl = document.querySelector(SEL.strategyPropertiesDataRange)
    if (dataRangeEl) {
      let childs = dataRangeEl.getElementsByTagName('span')
      if (childs && childs.length >= 4) {
        result[getText(childs[0])] = getText(childs[1])
        result[getText(childs[2])] = getText(childs[3])
      }
    }

    console.log('getStrategyPropertyDataOld get strategy symbol info')
    await page.waitForSelector(SEL.strategyPropertiesSymbolInfo, 100)
    let symbolInfoEl = document.querySelector(SEL.strategyPropertiesSymbolInfo)
    if (symbolInfoEl) {
      let childs = symbolInfoEl.getElementsByTagName('span')
      if (childs && childs.length >= 2) {
        result[getText(childs[0])] = getText(childs[1])
      }
    }

    console.log('getStrategyPropertyDataOld get strategy inputs')
    await page.waitForSelector(SEL.strategyPropertiesStrategyInputsBtn, 100)
    let strategyInputBtn = document.querySelector(SEL.strategyPropertiesStrategyInputsBtn)
    if (strategyInputBtn.ariaExpanded === "false") {
      page.mouseClickSelector(SEL.strategyPropertiesStrategyInputsBtn)
    } await page.waitForSelector(SEL.strategyPropertiesStrategyInputs, 100)
    let strategyInputsEl = document.querySelector(SEL.strategyPropertiesStrategyInputs)
    if (strategyInputsEl) {
      let childs = document.querySelectorAll('span[class^="elem"')
      for (let i = 0; i < childs.length; i += 2) {
        let key = getText(childs[i])
        if (!key.includes("Best Short") && !key.includes("Best Long "))
          result[key] = getText(childs[i + 1])
      }
    }

    console.log('getStrategyPropertyDataOld get strategy properties')
    await page.waitForSelector(SEL.strategyPropertiesStrategyProperties, 100)
    let strategyPropertiesEl = document.querySelector(SEL.strategyPropertiesStrategyProperties)
    if (strategyPropertiesEl) {
      let childs = strategyPropertiesEl.getElementsByTagName('span')
      for (let i = 0; i < childs.length; i += 2) {
        result[getText(childs[i])] = getText(childs[i + 1])
      }
    }
  } catch (e) {
    return null
  }
  return result
}
// For old strategy tester view
async function getStrategyPropertyDataNew(isDeepTest, deepfrom, deepto, name) {
  console.log('getStrategyPropertyDataNew', isDeepTest, deepfrom, deepto, name)
  let result = {}
  try {
    console.log('getStrategyPropertyDataNew get strategy data range')
    await util.switchToStrategyTradesTab()
    await page.waitForTimeout(500)
    let allHeadersEl = document.querySelectorAll(SEL2.strategyReportHeader)
    if (!allHeadersEl || allHeadersEl.length === 0) {
      return result
    }
    let emptyCoulmnCounter = 0
    let dateIndex
    for (let i = 0; i < allHeadersEl.length; i++) {
      if (allHeadersEl[i].innerText.includes("Date")) {
        dateIndex = i + 1
        break
      } else if (allHeadersEl[i].innerText === "") {
        emptyCoulmnCounter++
      }
    }
    if (dateIndex === undefined) {
      return result
    }

    let table = await page.waitForSelector(SEL2.strategyReportTable, 100)
    let rows = await page.waitForSelectorAll(SEL2.strategyReportRow, 100)
    let to = rows[0].querySelector(`td:nth-child(${dateIndex}) div[class^="cell-"][data-part="0"]`).innerText
    let toFormatted = new Date(to).toISOString().split('T')[0]

    await util.scrollToBottom(table)
    rows = await page.waitForSelectorAll(SEL2.strategyReportRow, 100)
    let from = rows[rows.length - 1].querySelector(`td:nth-child(${dateIndex}) div[class^="cell-"][data-part="1"]`).innerText
    let fromFormatted = new Date(from).toISOString().split('T')[0]

    result['Trading range (yyyy-mm-dd)'] = fromFormatted + ' - ' + toFormatted
    if (isDeepTest) {
      fromFormatted = new Date(deepfrom).toISOString().split('T')[0]
      toFormatted = new Date(deepto).toISOString().split('T')[0]
    }
    result['Backtesting range (yyyy-mm-dd)'] = fromFormatted + ' - ' + toFormatted


    console.log('getStrategyPropertyDataNew get strategy symbol info')
    result['Symbol'] = await util.getTickerExchange()

    console.log('getStrategyPropertyDataNew get strategy inputs')
    await tv.openCurrentStrategy(true)
    let inputs = await tv.getStrategyParams()
    for (let key in inputs) {
      if (!key.includes("Best Short") && !key.includes("Best Long "))
        result[key] = inputs[key]
    }
    await util.closeStrategyPropertyDialog()

    console.log('getStrategyPropertyDataNew get strategy properties')
    await tv.openCurrentStrategy(false)
    let props = await tv.getStrategyParams()
    for (let key in props) {
      result[key] = props[key]
    }
    await util.closeStrategyPropertyDialog()

  } catch (e) {
    console.error('getStrategyPropertyDataNew error:', e)
    return null
  }
  return result
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

  let buttons = document.querySelectorAll(SEL.datePickerDecadesButtons)
  for (let button of buttons) {
    if (button.innerText === year.toString()) {
      if (button.disabled) {
        return "Deep Backtesting year is out of range: " + year + ' (' + dateValue + ')';
      }
      page.mouseClick(button)
      await page.waitForTimeout(52)
      break
    }
  }
  buttons = document.querySelectorAll(SEL.datePickerMonthButtons)
  for (i = 0; i < 12; i++) {
    if (i === month) {
      if (buttons[i].disabled) {
        return "Deep Backtesting month is out of range: " + MONTHS[month] + ' (' + dateValue + ')';
      }
      page.mouseClick(buttons[i])
      await page.waitForTimeout(52)
      break
    }
  }

  buttons = document.querySelectorAll(SEL.datePickerDaysButtons)
  for (let button of buttons) {
    if (button.innerText === day.toString()) {
      if (button.disabled) {
        return "Deep Backtesting day is out of range: " + day + ' (' + dateValue + ')';
      }
      page.mouseClick(button)
      await page.waitForTimeout(52)
      break
    }
  }
  return null
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
        console.log('getStrategyParams 1 skipped:', propText)
        continue
      }
    } else if (propClassName.includes('fill-')) {
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
        console.log('getStrategyParams 2 skipped:', propText)
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

