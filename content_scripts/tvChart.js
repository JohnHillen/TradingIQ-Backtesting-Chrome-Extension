tvChart = {}

tvChart.getTicker = async () => {
  let tickerEl = document.querySelector(SEL.chartTicker)
  if (!tickerEl)
    throw new Error(`Can't get TradingView symbol element on chart`)

  let curTickerName = tickerEl.innerText
  // const fixCurTickerName = curTickerName.includes('\n') ?  curTickerName.split('\n')[1] : curTickerName
  return curTickerName.includes('\n') ? curTickerName.split('\n')[1] : curTickerName
}

tvChart.getCurrentTimeFrame = async () => {
  const isFavoriteTimeframe = await document.querySelector(SEL.chartTimeframeFavorite)
  const curTimeFrameEl = isFavoriteTimeframe ? await page.waitForSelector(SEL.chartTimeframeActive, 500) :
    await page.waitForSelector(SEL.chartTimeframeMenuOrSingle, 500)

  if (!curTimeFrameEl || !curTimeFrameEl.innerText) {
    throw new Error('There is not timeframe element on page. Open correct page please')
    // return null
  }

  let curTimeFrameText = curTimeFrameEl.innerText
  curTimeFrameText = tvChart.correctTF(curTimeFrameText)
  return curTimeFrameText
}


tvChart.getAllUserTimeframes = async () => {
  console.log('TVChart.getAllUserTimeframes')
  const timeFrameMenuEl = await page.waitForSelector(SEL.chartTimeframeMenuOrSingle)
  if (!timeFrameMenuEl)
    throw new Error('There is no timeframe selection menu element on the page')

  await page.waitForTimeout(200)
  page.mouseClick(timeFrameMenuEl)

  const allMenuTFItems = document.querySelectorAll(SEL.chartTimeframeMenuItem)
  let allTimeFrames = []
  for (let item of allMenuTFItems) {
    const tfVal = item.getAttribute('data-value')
    let tfNormValue = tfVal
    const isMinutes = tvChart.isTFDataMinutes(tfVal)
    tfNormValue = isMinutes && parseInt(tfVal) % 60 === 0 ? `${parseInt(tfVal) / 60}h` : isMinutes ? `${tfVal}m` : tfNormValue // If hours
    if (tfVal[tfVal.length - 1] === 'S')
      tfNormValue = `${tfVal.substr(0, tfVal.length - 1)}s`
    if (tfVal[tfVal.length - 1] === 'T')
      tfNormValue = `${tfVal.substr(0, tfVal.length - 2)}tick`
    allTimeFrames.push(tfNormValue)
  }
  if (allTimeFrames.length === 0)
    throw new Error('There is no timeframes on the chart. Open correct page please')

  await page.waitForTimeout(200)
  page.mouseClick(timeFrameMenuEl)

  console.log('TVChart.getAllUserTimeframes: allTimeFrames:', allTimeFrames)

  return allTimeFrames
}

tvChart.changeTimeFrame = async (setTF) => {
  console.log('TVChart.changeTimeFrame: to:', setTF)
  const strategyTF = tvChart.correctTF(setTF)

  let curTimeFrameText = await tvChart.getCurrentTimeFrame()

  if (strategyTF === curTimeFrameText) // Timeframe already set
    return

  // Search timeframe among favorite timeframes
  const isFavoriteTimeframe = await document.querySelector(SEL.chartTimeframeFavorite)
  if (isFavoriteTimeframe) {
    await page.waitForSelector(SEL.chartTimeframeFavorite, 1000)
    const allTimeFrameEl = document.querySelectorAll(SEL.chartTimeframeFavorite)
    for (let tfEl of allTimeFrameEl) {
      const tfVal = !tfEl || !tfEl.innerText ? '' : tvChart.correctTF(tfEl.innerText)
      if (tfVal === strategyTF) {
        tfEl.click() // Timeframe changed
        return
      }
    }
  }

  // Search timeframe among timeframes menu items
  const timeFrameMenuEl = await page.waitForSelector(SEL.chartTimeframeMenuOrSingle)
  if (!timeFrameMenuEl)
    throw new Error('There is no timeframe selection menu element on the page')

  await page.waitForTimeout(200)
  page.mouseClick(timeFrameMenuEl)
  const menuTFItem = await page.waitForSelector(SEL.chartTimeframeMenuItem, 1500)
  if (!menuTFItem)
    throw new Error('There is no item in timeframe menu on the page')

  await page.waitForTimeout(200)
  let foundTF = await tvChart.selectTimeFrameMenuItem(strategyTF)
  if (foundTF) {
    curTimeFrameText = await tvChart.getCurrentTimeFrame()
    if (strategyTF !== curTimeFrameText)
      throw new Error(`Failed to set the timeframe value to "${strategyTF}", the current "${curTimeFrameText}"`)
    return //`Timeframe changed to ${alertTF}`
  }

  //Add timeframe to the list
  await util.addTimeframe(strategyTF);

  await page.waitForTimeout(1000)
  foundTF = await tvChart.selectTimeFrameMenuItem(strategyTF)
  await page.waitForTimeout(1000)
  curTimeFrameText = await tvChart.getCurrentTimeFrame()
  if (!foundTF)
    throw new Error(`Failed to add a timeframe "${strategyTF}" to the list`)
  else if (strategyTF !== curTimeFrameText)
    throw new Error(`Failed to set the timeframe value to "${strategyTF}" after adding it to timeframe list, the current "${curTimeFrameText}"`)
}

tvChart.toggleTimeFrame = async () => {
  const cycleTf = global.currentCycle.tf === CURRENT_TF ? await tvChart.getCurrentTimeFrame() : global.currentCycle.tf
  let tf1 = "1m" === cycleTf ? "2m" : "1m"

  let deepCheckbox = await page.waitForSelector(SEL.strategyDeepTestCheckbox, 500);
  if (deepCheckbox && global.isDeepTest && deepCheckbox.checked) {
    console.log('TVChart.toggleTimeFrame disable deep test')
    page.mouseClick(deepCheckbox)
    await page.waitForTimeout(750);
  }

  console.log('TVChart.toggleTimeFrame:', cycleTf, '->', tf1)
  await tvChart.changeTimeFrame(tf1)
  await page.waitForTimeout(500)

  console.log('TVChart.toggleTimeFrame:', tf1, '->', cycleTf)
  await tvChart.changeTimeFrame(cycleTf)
  await page.waitForTimeout(500)

  deepCheckbox = await page.waitForSelector(SEL.strategyDeepTestCheckbox, 500);
  if (deepCheckbox && global.isDeepTest && !deepCheckbox.checked) {
    console.log('TVChart.toggleTimeFrame enable deep test')
    page.mouseClick(deepCheckbox)
    await page.waitForTimeout(750);
  }
}

tvChart.selectTimeFrameMenuItem = async (alertTF) => {
  const allMenuTFItems = document.querySelectorAll(SEL.chartTimeframeMenuItem)
  for (let item of allMenuTFItems) {
    const tfVal = item.getAttribute('data-value')
    let tfNormValue = tfVal
    const isMinutes = tvChart.isTFDataMinutes(tfVal)
    tfNormValue = isMinutes && parseInt(tfVal) % 60 === 0 ? `${parseInt(tfVal) / 60}h` : isMinutes ? `${tfVal}m` : tfNormValue // If hours
    if (tfVal[tfVal.length - 1] === 'S')
      tfNormValue = `${tfVal.substr(0, tfVal.length - 1)}s`
    if (tfNormValue === alertTF) {
      page.mouseClick(item)
      await page.waitForSelector(SEL.chartTimeframeMenuItem, 1500, true)
      return tfNormValue
    }
  }
  return null
}

tvChart.isTFDataMinutes = (tf) => !['S', 'D', 'M', 'W', 'R', 'T'].includes(tf[tf.length - 1])
tvChart.correctTF = (tf) => ['D', 'M', 'W'].includes(tf) ? `1${tf}` : tf

tvChart.getStrategyFromDataWindow = async (strategyName) => {
  // Enable the strategy
  let dataWindowWidgetEl = document.querySelector(SEL.dataWindowWidget)
  let headers = dataWindowWidgetEl.querySelectorAll('span[class^="headerTitle-"]')
  let iqWidgetEl = null
  let firstEl = true
  for (let header of headers) {
    console.log('TVChart.getStrategyFromDataWindow: process header:', header.innerText)
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
  console.log('TVChart.getStrategyFromDataWindow: iqWidgetEl:', iqWidgetEl)
  return iqWidgetEl
}

//Enables the strategy if strategyName === null enable first one in the DataWindow-Widget and disabled all other Trading IQ strategies
//If strategyName is not found, add strategy to the DataWindow-Widget
tvChart.enableStrategy = async (strategyName) => {
  let iqWidgetEl = await tvChart.getStrategyFromDataWindow(strategyName)

  //If iqWidget is still null, add strategy to the DataWindow-Widget
  if (iqWidgetEl === null) {
    console.log('TVChart.enableStrategy: Add strategy to the DataWindow-Widget')
    page.mouseClickSelector(SEL.indicatorDropdown)
    let sideBarTabs = []
    let maxTime = Date.now() + 30000
    while (true) {
      await page.waitForTimeout(500)
      sideBarTabs = [...document.querySelectorAll(SEL.indicatorsDialogSideBarTabs)]
      let filteredMap = sideBarTabs.map(div => div.innerText).filter(txt => txt.includes('Invite-only'))
      if (global.workerStatus === null || Date.now() > maxTime || filteredMap.length > 0) {
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
      if (global.workerStatus === null || found || Date.now() > maxTime) {
        break
      }
      if (indicatorList && indicatorList.length > 0) {
        // Select the container element
        const container = document.querySelector(SEL.indicatorsDialogContentListContainer);

        // Scroll down by 300px
        if (container) {
          container.scrollBy(0, 300);
        }
      }
    }

    if (!found) {
      console.log('TVChart.enableStrategy:', strategyName, 'not found in the invite only tab', indicatorList)
      return null
    }

    maxTime = Date.now() + 60000
    while (true) {
      await page.waitForTimeout(250)
      iqWidgetEl = await tvChart.getStrategyFromDataWindow(strategyName)
      if (global.workerStatus === null || iqWidgetEl || Date.now() > maxTime) {
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

tvChart.setTestDateRange = async () => {
  console.log('TVChart.setTestDateRange:', global.isDeepTest, global.deepFrom, global.deepTo);

  let deepCheckbox = document.querySelector(SEL.strategyDeepTestCheckbox);
  if (deepCheckbox) {
    // Old behavior for deep test
    global.isNewTestDateRangeBehavior = false;
    await tvChart.setDeepDateValues(deepCheckbox);
    return;
  }

  let testDateRangeButton = document.querySelector(SEL.testDateRangeButton)
  if (!testDateRangeButton) {
    throw new Error('There is no Test Date Range button on the chart')
  }

  if (testDateRangeButton.getAttribute('aria-expanded') === 'false') {
    console.log('TVChart.setTestDateRange: open Test Date Range menu');
    page.mouseClick(testDateRangeButton);
    await page.waitForTimeout(200);
  }

  let resetToChartSession = document.querySelector(SEL.testDateRangeItemResetToChartSeession);
  if (resetToChartSession && global.testDateRangeType === RANGE_FROM_CHART) {
    console.log('TVChart.setTestDateRange: Reset to chart session');
    page.mouseClickSelector(SEL.testDateRangeItemResetToChartSeession);
    await page.waitForTimeout(200);
    return;
  }

  switch (global.testDateRangeType) {
    case RANGE_FROM_CHART:
      console.log('TVChart.setTestDateRange: RangeFromChart');
      page.mouseClickSelector(SEL.testDateRangeItemRangeFromChart);
      break;
    case LAST_7_DAYS:
      console.log('TVChart.setTestDateRange: Last7Days');
      page.mouseClickSelector(SEL.testDateRangeItemLast7Days);
      break;
    case LAST_30_DAYS:
      console.log('TVChart.setTestDateRange: Last30Days');
      page.mouseClickSelector(SEL.testDateRangeItemLast30Days);
      break;
    case LAST_90_DAYS:
      console.log('TVChart.setTestDateRange: Last90Days');
      page.mouseClickSelector(SEL.testDateRangeItemLast90Days);
      break;
    case LAST_365_DAYS:
      console.log('TVChart.setTestDateRange: Last365Days');
      page.mouseClickSelector(SEL.testDateRangeItemLast365Days);
      break;
    case ENTIRE_HISTORY:
      console.log('TVChart.setTestDateRange: EntireHistory');
      page.mouseClickSelector(SEL.testDateRangeItemEntireHistory);
      break;
    case CUSTOM_RANGE:
      console.log('TVChart.setTestDateRange: CustomRange');
      page.mouseClickSelector(SEL.testDateRangeItemCustomRange);
      await page.waitForTimeout(500);
      await setCustomDateRange(SEL.testDateRangeCustomStartDate, SEL.testDateRangeCustomEndDate);
      await page.waitForTimeout(300);
      let customApplyBtn = document.querySelector(SEL.testDateRangeCustomApplyBtn);
      if (!customApplyBtn || customApplyBtn.disabled) {
        throw new Error('There is no Custom Apply button on the chart or it is disabled');
      }
      page.mouseClickSelector(SEL.testDateRangeCustomApplyBtn);
      await page.waitForTimeout(200);
      break;
  }
  console.log('TVChart.setTestDateRange: Test Date Range set to:', global.testDateRangeType);
}

tvChart.setDeepDateValues = async (deepCheckbox) => {
  console.log('TVChart.setDeepDateValues', deepCheckbox, global.isDeepTest, global.deepFrom, global.deepTo);

  if (deepCheckbox.checked !== global.isDeepTest) {
    console.log('TVChart.setDeepDateValues: Set deep test');
    page.mouseClick(deepCheckbox);
    await page.waitForTimeout(500);
  }

  if (global.isDeepTest) {
    await setCustomDateRange(SEL.strategyDeepTestStartDate, SEL.strategyDeepTestEndDate);
  }
}

async function setCustomDateRange(selectorStart, selectorEnd) {
  console.log('TVChart.setCustomDateRange');
  let startDate = document.querySelector(selectorStart)
  let endDate = document.querySelector(selectorEnd)
  let endDateValue = endDate.value
  let startDateValue = startDate.value

  if (global.isNewTestDateRangeBehavior) {
    startDateValue = startDate.querySelector('input').value;
    endDateValue = endDate.querySelector('input').value;
  }

  if (global.deepFrom > endDateValue) {
    if (endDateValue !== global.deepTo) {
      await tv.setDeepDateValues(endDate, global.deepTo)
    }
    if (startDateValue !== global.deepFrom) {
      await tv.setDeepDateValues(startDate, global.deepFrom)
    }
  }
  else {
    if (startDateValue !== global.deepFrom) {
      await tv.setDeepDateValues(startDate, global.deepFrom)
    }
    if (endDateValue !== global.deepTo) {
      await tv.setDeepDateValues(endDate, global.deepTo)
    }
  }
  let msg = await tv.generateDeepTestReport();
  console.log('TVChart.setCustomDateRange: Deep Test Result:', msg)
}

tvChart.updateReport = async () => {
  console.log('TVChart.updateReport: Start updating report');
  await waitForReportUpdate();

  await waitForReportUpdate();

  console.log('TVChart.isReportOutdated: Report is up to date');
  return false;
}

async function waitForReportUpdate(expected) {
  let updatingReportContainer = document.querySelector(SEL.updatingReportContainer);
  while (updatingReportContainer = document.querySelector(SEL.updatingReportContainer)) {
    console.log('TVChart.isReportOutdated: Report is being updated');
    await page.waitForTimeout(500);
    updatingReportContainer = document.querySelector(SEL.updatingReportContainer);
    if (!updatingReportContainer) {
      console.log('TVChart.isReportOutdated: Report is up to date');
      break;
    } else {
      const outdatedButton = document.querySelector(SEL.reportOutdatedButton);
      if (outdatedButton) {
        console.log('TVChart.isReportOutdated: Report is outdated');
        page.mouseClickSelector(SEL.reportOutdatedButton);
        await page.waitForTimeout(500);
      }
    }
  }
}