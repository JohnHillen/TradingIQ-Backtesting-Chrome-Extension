const global = {
    workerStatus: null,
    bestStrategyNumberCount: 0,
    currentBestStrategyNumbers: [],
    testResultNumberCount: 0,
    strategyParamsNumberCount: 0,
    isDeepTest: false,
    deepFrom: null,
    deepTo: null,
    cycleTf: null,
    currentCycle: null,
    indicatorLegendStatus: null,
    indicatorError: null,
    timeout: 60000,
    fileName: null,
    pfFilter: {},
    iqIndicator: null,
    isNova: null,
    isNovaTrend: null,
    isNovaReversion: null,
    isNovaTrendCycle: null,
    isNovaReversionCycle: null,
    isCS: null
}

global.reset = () => {
    global.bestStrategyNumberCount = 0
    global.currentBestStrategyNumbers = []
    global.testResultNumberCount = 0
    global.strategyParamsNumberCount = 0
    global.htmlEquityChartOnOff = false
    global.isDeepTest = false
    global.deepFrom = null
    global.deepTo = null
    global.cycleTf = null
    global.currentCycle = null
    global.indicatorLegendStatus = null
    global.indicatorError = null
    global.timeout = 60000
    global.fileName = null
    global.pfFilter = {}
    global.iqIndicator = null
    global.isNova = null
    global.isNovaTrend = null
    global.isNovaReversion = null
    global.isNovaTrendCycle = null
    global.isNovaReversionCycle = null
    global.isCS = null
}