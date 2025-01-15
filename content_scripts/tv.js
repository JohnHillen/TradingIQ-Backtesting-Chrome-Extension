const tv = {
  reportNode: null,
  reportDeepNode: null,
  tickerTextPrev: null,
  timeFrameTextPrev: null,
  isReportChanged: false
}

tv.setStrategyParams = async (name, propVal, isCheckOpenedWindow = false) => {
  console.log('setStrategyParams', name, propVal)
  if (isCheckOpenedWindow) {
    const indicatorTitleEl = document.querySelector(SEL.indicatorTitle)
    if (!indicatorTitleEl || indicatorTitleEl.innerText !== name) {
      return null
    }
  } else {
    const indicatorTitleEl = await tv.checkAndOpenStrategy(name) // In test.name - ordinary strategy name but in strategyData.name short one as in indicator title
    if (!indicatorTitleEl)
      return null
  }
  const indicProperties = document.querySelectorAll(SEL.indicatorProperty)
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
          await page.waitForTimeout(100)
          page.mouseClick(buttonEl)
          page.setSelByText(SEL.strategyListOptions, propVal[propText])
        }
      } else if (propClassName.includes('fill-')) {
        const checkboxEl = indicProperties[i].querySelector('input[type="checkbox"]')
        if (checkboxEl) {
          // const isChecked = checkboxEl.getAttribute('checked') !== null ? checkboxEl.checked : false
          const isChecked = Boolean(checkboxEl.checked)
          if (Boolean(propVal[propText]) !== isChecked) {
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
  if (!isCheckOpenedWindow && document.querySelector(SEL.okBtn))
    document.querySelector(SEL.okBtn).click()
  return true
}

tv.openCurrentStrategyParam = async () => {
  let stratParamEl = document.querySelector(SEL.strategyDialogParam)
  if (!stratParamEl) {
    await ui.showPopup('There is not strategy param button on the strategy tab. Test stopped. Open correct page please')
    return null
  }
  stratParamEl.click()
  const stratIndicatorEl = await page.waitForSelector(SEL.indicatorTitle, 2000)
  if (!stratIndicatorEl) {
    await ui.showPopup('There is not strategy parameters. Test stopped. Open correct page please')
    return null
  }
  const tabInputEl = document.querySelector(SEL.tabInput)
  if (!tabInputEl) {
    await ui.showPopup('There is not strategy parameters input tab. Test stopped. Open correct page please')
    return null
  }
  tabInputEl.click()
  const tabInputActiveEl = await page.waitForSelector(SEL.tabInputActive)
  if (!tabInputActiveEl) {
    await ui.showPopup('There is not strategy parameters active input tab. Test stopped. Open correct page please')
    return null
  }
  return true
}

tv.checkAndOpenStrategy = async (name) => {
  let indicatorTitleEl = document.querySelector(SEL.indicatorTitle)
  if (!indicatorTitleEl || indicatorTitleEl.innerText !== name) {
    try {
      await tv.switchToStrategyTab()
    } catch {
      return null
    }
    if (!await tv.openCurrentStrategyParam())
      return null
    indicatorTitleEl = document.querySelector(SEL.indicatorTitle)
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
    } else {
      throw new Error('There is not "Strategy Tester" tab on the page. Open correct page.')
    }
  }
  return true
}


tv.switchToStrategyTab = async () => {
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


  await tv.switchToStrategySummaryTab()

  await page.waitForSelector(SEL.strategyReportObserveArea, 10000)
  if (!tv.reportNode) {
    // tv.reportNode = await page.waitForSelector(SEL.strategyReport, 10000)
    tv.reportNode = await page.waitForSelector(SEL.strategyReportObserveArea, 10000)
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

  if (!tv.reportDeepNode) {
    tv.reportDeepNode = await page.waitForSelector(SEL.strategyReportDeepTestObserveArea, 5000)
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

tv.switchToStrategySummaryTab = async () => {
  await tv.openStrategyTab()

  let stratSummaryEl = await page.waitForSelector(SEL.strategySummary, 1000)
  if (!stratSummaryEl) {
    throw new Error('There is not "Performance summary" tab on the page. Open correct page.')
  }
  if (!page.$(SEL.strategySummaryActive))
    stratSummaryEl.click()
  const isActive = await page.waitForSelector(SEL.strategySummaryActive, 1000)
  if (!isActive) {
    console.error('The "Performance summary" tab is not active after click')
  }
}

tv.isParsed = false

tv.parseReportTable = async (isDeepTest) => {
  const strategyHeaders = []
  const selHeader = isDeepTest ? SEL.strategyReportDeepTestHeader : SEL.strategyReportHeader
  const selRow = isDeepTest ? SEL.strategyReportDeepTestRow : SEL.strategyReportRow
  await page.waitForSelector(selHeader, 2500)

  let allHeadersEl = document.querySelectorAll(selHeader)
  if (!allHeadersEl || !(allHeadersEl.length === 4 || allHeadersEl.length === 5)) { // 5 - Extra column for full screen
    if (!tv.isParsed)
      throw new Error('Can\'t get performance headers.')
    else
      return {}
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
      // if (paramName === 'Net Profit') console.log('##paramName', paramName, allTdEl[1].innerText)
      let isSingleValue = allTdEl.length === 3 || ['Buy & Hold Return', 'Max Run-up', 'Max Drawdown', 'Sharpe Ratio', 'Sortino Ratio', 'Open PL'].includes(paramName)
      for (let i = 1; i < allTdEl.length; i++) {
        if (isSingleValue && i >= 2)
          continue
        let values = allTdEl[i].innerText

        const isNegative = allTdEl[i].querySelector('[class^="negativeValue"]') && !['Avg Losing Trade', 'Largest Losing Trade', 'Gross Loss', 'Max Run-up', 'Max Drawdown'].includes(paramName)
        if (values && typeof values === 'string' && strategyHeaders[i]) {
          values = values.replaceAll(' ', ' ').replaceAll('−', '-').trim()
          const digitalValues = values.replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '')
          let digitOfValues = digitalValues.match(/-?\d+\.?\d*/)
          const nameDigits = isSingleValue ? paramName : `${paramName}: ${strategyHeaders[i]}`
          const namePercents = isSingleValue ? `${paramName} %` : `${paramName} %: ${strategyHeaders[i]}`
          if ((values.includes('\n') && values.endsWith('%'))) {
            const valuesPair = values.split('\n', 2)
            if (valuesPair && valuesPair.length === 2) {
              const digitVal0 = valuesPair[0].replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '') //.match(/-?\d+\.?\d*/)
              const digitVal1 = valuesPair[1].replaceAll(/([\-\d\.])|(.)/g, (a, b) => b || '') //match(/-?\d+\.?\d*/)

              if (Boolean(digitVal0)) {
                report[nameDigits] = nameDigits.includes('Trades') ? parseInt(digitVal0) : parseFloat(digitVal0)//[0])
                if (report[nameDigits] > 0 && isNegative)
                  report[nameDigits] = report[nameDigits] * -1
              } else {
                report[nameDigits] = valuesPair[0]
              }
              if (Boolean(digitVal1)) {
                report[namePercents] = namePercents.includes('Trades') ? parseInt(digitVal1) : parseFloat(digitVal1) //[0])
                if (report[namePercents] > 0 && isNegative)
                  report[namePercents] = report[namePercents] * -1
              } else {
                report[namePercents] = valuesPair[1]
              }
            }
          } else if (Boolean(digitOfValues)) {
            report[nameDigits] = nameDigits.includes('Trades') ? parseInt(digitalValues) : parseFloat(digitalValues)//[0])
            if (report[nameDigits] > 0 && isNegative)
              report[nameDigits] = report[nameDigits] * -1
          } else
            report[nameDigits] = values
        }
      }
    }
  }
  return report
}

tv.generateDeepTestReport = async () => {
  const generateBtnEl = await page.waitForSelector(SEL.strategyDeepTestGenerateBtn)
  if (generateBtnEl) {
    page.mouseClick(generateBtnEl)
  } else if (page.$(SEL.strategyDeepTestGenerateBtnDisabled)) {
    return 'Deep backtesting process is not started'
  } else {
    return 'somethging else'
  }
  return ''
}

tv.getPerformance = async (testResults) => {
  let reportData = {}
  let message = ''
  let isProcessError = null
  let selProgress = testResults.isDeepTest ? SEL.strategyReportDeepTestInProcess : SEL.strategyReportInProcess
  let selReady = testResults.isDeepTest ? SEL.strategyReportDeepTestReady : SEL.strategyReportReady
  const dataWaitingTime = 60000
  console.log('getPerformance isDeepTest: ', testResults.isDeepTest)
  if (testResults.isDeepTest) {
    message = await tv.generateDeepTestReport() //testResults.dataLoadingTime * 2000)
    if (message) {
      isProcessError = true
    }
  }

  let isProcessStart = await page.waitForSelector(selProgress, 2500)
  let isProcessEnd = tv.isReportChanged
  if (isProcessStart) {
    const tick = 100
    isProcessEnd = await page.waitForSelector(selReady, dataWaitingTime)
    for (let i = 0; i < dataWaitingTime / tick; i++) {
      isProcessError = await page.waitForSelector(SEL.strategyReportWarningHint, tick)
      isProcessEnd = document.querySelector(selReady)
      if (isProcessError || isProcessEnd) {
        break
      }
      if ((tick * i) % 2000 === 0) {
        console.log('Switch between Strategy Summary and Properties View')
        let isStrategySummaryActive = await page.waitForSelector(SEL.strategySummaryActive, tick)
        page.mouseClickSelector(!isStrategySummaryActive ? SEL.strategySummary : SEL.strategyProperties)
      }
    }
  } else if (isProcessEnd) {
    isProcessStart = true
  }

  isProcessError = isProcessError || document.querySelector(SEL.strategyReportError)
  await page.waitForTimeout(250) // Waiting for update digits. 150 is enough but 250 for reliable TODO Another way?

  if (!isProcessError) {
    reportData = await tv.parseReportTable(testResults.isDeepTest)
    console.log('Report data ready:', reportData)
  }

  return { error: isProcessError ? 2 : !isProcessStart ? 1 : !isProcessEnd ? 3 : null, message: message, data: reportData }
}

tv.getStrategyPropertyData = async () => {
  function getText(child) {
    if (!child)
      return ""
    let text = child.innerText.trim().replaceAll(',', '')
    text = text.endsWith(':') ? text.slice(0, text.length - 1) : text
    return text
  }
  let result = {}
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

  await page.waitForSelector(SEL.strategyPropertiesSymbolInfo, 100)
  let symbolInfoEl = document.querySelector(SEL.strategyPropertiesSymbolInfo)
  if (symbolInfoEl) {
    let childs = symbolInfoEl.getElementsByTagName('span')
    if (childs && childs.length >= 2) {
      result[getText(childs[0])] = getText(childs[1])
    }
  }

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

  await page.waitForSelector(SEL.strategyPropertiesStrategyProperties, 100)
  let strategyPropertiesEl = document.querySelector(SEL.strategyPropertiesStrategyProperties)
  if (strategyPropertiesEl) {
    let childs = strategyPropertiesEl.getElementsByTagName('span')
    for (let i = 0; i < childs.length; i += 2) {
      result[getText(childs[i])] = getText(childs[i + 1])
    }
  }
  return result
}