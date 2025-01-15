util = {}

util.selCheck = () => {
    console.log('selCheck')
    let strategyTab = document.querySelector(SEL.strategyTesterTab)
    let strategyTabActive = document.querySelector(SEL.strategyTesterTabActive)
    let debugMsg = 'strategyTesterTab: ' + (strategyTab !== null ? 'active' : 'no active') + ', strategyTesterTabActive: ' + (strategyTabActive !== null ? 'active' : 'no active')

    let scriptTab = document.querySelector(SEL.scriptEditorTab)
    let scriptTabActive = document.querySelector(SEL.scriptEditorActive)
    debugMsg += '\nscriptEditorTab: ' + (scriptTab !== null ? 'active' : 'no active') + ', scriptEditorTabActive: ' + (scriptTabActive !== null ? 'active' : 'no active')
    console.log('selCheck return:', debugMsg)
    return debugMsg
}

util.openStrategyTab = async () => {
    const strategyTabActive = await page.waitForSelector(SEL.strategyTesterTabActive, 500)
    if (!strategyTabActive)
        page.mouseClickSelector(SEL.strategyTesterTab)
}

util.openDataWindow = async () => {
    let btnObjectTreeDataWindowEl = document.querySelector(SEL.dataWindowAndObjectTreeBtn)
    if (btnObjectTreeDataWindowEl.ariaPressed === "false") {
        btnObjectTreeDataWindowEl.click()
        await page.waitForTimeout(50)
    }
    let btnDataWindowEl = await page.waitForSelector(SEL.dataWindowBtn, 200)
    if (btnDataWindowEl.ariaSelected === "false") {
        btnDataWindowEl.click()
        await page.waitForTimeout(50)
    }
}

util.getRandomInt = function(max, min) {
    return Math.floor(Math.random() * (45 - 20) + 20)
}