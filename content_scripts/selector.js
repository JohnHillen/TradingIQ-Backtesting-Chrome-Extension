
const SEL = {
    tvLegendIndicatorItem: 'div[data-name="legend"] div[class^="sourcesWrapper"] div[class^="sources"] div[data-name="legend-source-item"]',
    tvLegendIndicatorItemTitle: 'div[data-name="legend-source-title"]',
    tvDialogRoot: '#overlap-manager-root',
    indicatorTitle: '#overlap-manager-root div[data-name="indicator-properties-dialog"] [class^="container"] div[class^="title"]',
    indicatorDropdown: '#header-toolbar-indicators button',
    indicatorsDialogInput: 'div[data-name="indicators-dialog"] input[data-role="search"]',
    indicatorsDialogContent: 'div[data-name="indicators-dialog"] div[data-role="dialog-content"]',
    indicatorsDialogContentList: 'div[data-name="indicators-dialog"] div[data-role="dialog-content"] div[data-role="list-item"]',
    indicatorsDialogSideBarTabs: 'div[data-name="indicators-dialog"] div[data-role="dialog-sidebar"] div[class^="tab"]',
    indicatorsDialogCloseBtn: 'div[data-name="indicators-dialog"] button[data-name="close"]',
    tabInput: '#overlap-manager-root div[data-name="indicator-properties-dialog"] [class^="tab"] button#inputs',
    tabInputActive: '#overlap-manager-root div[data-name="indicator-properties-dialog"] [class^="tab"] button#inputs[class*="selected"]',
    tabProperties: '#overlap-manager-root div[data-name="indicator-properties-dialog"] [class^="tab"] button#properties',
    tabPropertiesActive: '#overlap-manager-root div[data-name="indicator-properties-dialog"] [class^="tab"] button#properties[class*="selected"]',
    ticker: '#header-toolbar-symbol-search > div[class*="text-"]',
    timeFrame: '#header-toolbar-intervals div[data-role^="button"]',
    timeFrameActive: '#header-toolbar-intervals div[data-role^="button"][class*="isActive"]',
    indicatorScroll: 'div[data-name="indicator-properties-dialog"] div[class^="scrollable-"]',
    indicatorPropertyContent: 'div[data-name="indicator-properties-dialog"] div[class^="content-"] div[class^="cell-"]',
    okBtn: 'div[data-name="indicator-properties-dialog"] div[class^="footer-"] button[name="submit"]',
    cancelBtn: 'div[data-name="indicator-properties-dialog"] span[data-name="close"][data-role="button"]',
    scriptEditorTab: '[data-name="scripteditor"]',
    scriptEditorActive: '[data-name="scripteditor"][data-active="true"]',

    datePickerSwitchToMonth: 'div[class^="picker-"] div[class^="calendar-"] button[aria-label^="Switch to months"]',
    datePickerSwitchToYears: 'div[class^="picker-"] div[class^="calendar-"] button[aria-label^="Switch to years"]',
    datePickerViewDecades: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-decades-"]',
    datePickerDecadesButtons: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-decades-"] button[class^="decade-"]',
    datePickerViewMonths: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-year-"]',
    datePickerMonthButtons: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-year-"] button',
    datePickerViewDays: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-month-"]',
    datePickerDaysButtons: 'div[class^="picker-"] div[class^="calendar-"] div[class^="view-month-"] button',

    dataWindowAndObjectTreeBtn: 'button[data-name="object_tree"]',
    dataWindowBtn: '#data-window',
    dataWindowWidget: 'div[class="layout__area--right"] div[class="widgetbar-pagescontent"] div[class="widgetbar-page active"]  div[class="widgetbar-widgetbody"]',
    dataWindowTreeGrid: 'div[class="layout__area--right"] div[class="widgetbar-pagescontent"] div[class="widgetbar-page active"]  div[class="widgetbar-widgetbody"]',

    strategyTesterTab: '[data-name="backtesting"]',
    strategyTesterTabActive: '[data-name="backtesting"][data-active="true"]',
    strategyCaption: '#bottom-area div[class^="backtesting"]  [class^="strategyGroup"] [data-strategy-title]',
    strategyDialogParam: '#bottom-area div[class^="backtesting"]  [class^="strategyGroup"]  > div:nth-child(2) > button:nth-child(1)',

    strategySummary: 'button[id="Performance Summary"]',
    strategySummaryActive: 'button[id="Performance Summary"][class*="selected"]',
    strategyProperties: 'button[id="Properties"]',
    strategyPropertiesDataRange: '#bottom-area div[class^="reportViewContainer"] button[aria-controls="id_Date-range"] span[class^="minimizedData"]',
    strategyPropertiesSymbolInfo: '#bottom-area div[class^="reportViewContainer"] button[aria-controls="id_Symbol-info"] span[class^="minimizedData"]',
    strategyPropertiesStrategyInputsBtn: '#bottom-area div[class^="reportViewContainer"] button[aria-controls="id_Strategy-inputs"]',
    strategyPropertiesStrategyInputs: '#bottom-area div[class^="reportViewContainer"] #id_Strategy-inputs',
    strategyPropertiesStrategyProperties: '#bottom-area div[class^="reportViewContainer"] button[aria-controls="id_Strategy-properties"] span[class^="minimizedData"]',

    strategyReportObserveArea: '#bottom-area div[class^="backtesting"] div[class^="widgetContainer"]',
    strategyReportInProcess: '#bottom-area div[class^="backtesting"] div[class^="widgetContainer"]  div[role="progressbar"]',
    strategyReportReady: '#bottom-area div[class^="backtesting"] div[class^="widgetContainer"] div[class^="reportContainer"] [class*="root"]',

    strategyReportError: '#bottom-area div[class^="backtesting"] div[class^="container"] [class*=emptyStateIcon]',
    strategyReportHeader: '#bottom-area div[class^="backtesting"] div[class^="widgetContainer"] div[class^="reportContainer"] table thead > tr > th',
    strategyReportRow: '#bottom-area  div[class^="backtesting"] div[class^="widgetContainer"] div[class^="reportContainer"] table tbody > tr',
    strategyReportWarningHint: '#bottom-area  div[class^="backtesting"] div[class^="warningHint"]',

    strategyDeepTestCheckbox: '#bottom-area div[class^="backtesting"]  [class^="deepHistoryContainer"]  [class^="switcher"] input',
    strategyDeepTestStartDate: '#bottom-area div[class^="backtesting"]  [class^="historyParams"]  [class^="container" ]> div:nth-child(1) div[class^="pickerInput"] input',
    strategyDeepTestEndDate: '#bottom-area div[class^="backtesting"]  [class^="historyParams"]  [class^="container" ]> div:nth-child(3) div[class^="pickerInput"] input',
    strategyDeepTestGenerateBtn: '#bottom-area div[class^="backtesting"]  [class^="historyParams"] button[class^="generateReportBtn"]:not([disabled])',
    strategyDeepTestGenerateBtnDisabled: '#bottom-area div[class^="backtesting"]  [class^="historyParams"] button[class^="generateReportBtn"][disabled]',

    strategyReportDeepTestObserveArea: '#bottom-area div[class^="backtesting"] div[class^="backtesting-content-wrapper"]',
    strategyReportDeepTestInProcess: '#bottom-area div[class^="backtesting"] div[class^="backtesting-content-wrapper"] div[role="progressbar"]',
    strategyReportDeepTestReady: '#bottom-area div[class^="backtesting"] div[class^="backtesting-content-wrapper"] div[class^="reportContainer"] [class*="root"]',
    strategyReportDeepTestHeader: '#bottom-area div[class^="backtesting"] div[class^="backtesting-content-wrapper"] div[class^="reportContainer"] table thead > tr > th',
    strategyReportDeepTestRow: '#bottom-area  div[class^="backtesting"] div[class^="backtesting-content-wrapper"] div[class^="reportContainer"] table tbody > tr',

    strategyListOptions: 'div[role="listbox"] div[data-name="menu-inner"] div[role="option"] span[class^="label-"]',
    strategyDefaultElement: '#property-actions',
    strategyDefaultElementList: '#id_property-actions_listbox span[class^="label-"]',

    changeIntervalDialog: 'div[data-dialog-name="change-interval-dialog"]',
    chartTicker: '#header-toolbar-symbol-search > div[class*="text-"]',
    chartTimeframeFavorite: '#header-toolbar-intervals button[data-value]',
    chartTimeframeActive: '#header-toolbar-intervals button[data-value][aria-checked="true"]',
    chartTimeframeMenuOrSingle: '#header-toolbar-intervals button[class^="menu"]',

    chartTimeframeMenuAddCustomTf: '#overlap-manager-root div[data-name="menu-inner"] div[class^="dropdown"] div[aria-level="1"][aria-posinset="1"][aria-haspopup="dialog"]',
    chartTimeframeAddCustomDialogInput: '#overlap-manager-root div[data-name="add-custom-interval-dialog"] input',
    chartTimeframeAddCustomDialogType: '#overlap-manager-root div[data-name="add-custom-interval-dialog"] span[aria-haspopup="listbox"]',
    chartTimeframeAddCustomDialogAddBtn: '#overlap-manager-root div[data-name="add-custom-interval-dialog"] button[name="submit"]',

    chartTimeframeMenuItem: '#overlap-manager-root div[data-name="menu-inner"] div[class^="dropdown"] div[data-value]',
    chartTimeframeMenuInput: '#overlap-manager-root div[data-name="menu-inner"] div[class^="dropdown"] div[class^="form"] > input',
    chartTimeframeMenuType: '#overlap-manager-root div[data-name="menu-inner"] div[class^="dropdown"] div[class^="form"] > div[class^="menu"]',
    chartTimeframeMenuAdd: '#overlap-manager-root div[data-name="menu-inner"] div[class^="dropdown"] div[class^="form"] > div[class^="add"]',
    chartTimeframeMenuTypeItems: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]',
    chartTimeframeMenuTypeItemsMin: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(1)',
    chartTimeframeMenuTypeItemsHours: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(2)',
    chartTimeframeMenuTypeItemsDays: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(3)',
    chartTimeframeMenuTypeItemsWeeks: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(4)',
    chartTimeframeMenuTypeItemsMonth: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(5)',
    chartTimeframeMenuTypeItemsRange: '#overlap-manager-root div[data-name="menu-inner"] > div[class^="item"]:nth-child(6)',
}

// New strategy Tester tabs: Overview, Performance, Trades analysis, Risk/performance ratios, List of trades
// The whole structure of the html elements has been changed, so we need to update the selectors
const SEL2 = {
    indicatorPropertyContent: 'div[data-name="indicator-properties-dialog"] div[class^="content-"] div[class^="cell-"], div[class^="checkboxItem-"]',

    strategyPropertiesBtn: '#overlap-manager-root div[role="menuitem"][aria-label^="Settings"]',
    strategySummary: 'button[id="Performance"]',
    strategySummaryActive: 'button[id="Performance"][class*="selected"]',
    strategyTradesAnalysis: 'button[id="Trades Analysis"]',
    strategyTradesAnalysisActive: 'button[id="Trades Analysis"][class*="selected"]',
    strategyRatios: 'button[id="Ratios"]', // Risk/performance ratios
    strategyRatiosActive: 'button[id="Ratios"][class*="selected"]', // Risk/performance ratios
    strategyTrades: 'button[id="List of Trades"]',
    strategyTradesActive: 'button[id="List of Trades"][class*="selected"]',

    strategyReportObserveArea: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"]',
    strategyReportInProcess: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"]  div[role="progressbar"]',
    strategyReportReady: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"] div[class^="wrapper-"] [class*="root"]',

    strategyReportError: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"] div[class^="container"] [class*=emptyStateIcon]',
    strategyReportTable: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"] div[class^="ka-table-wrapper"]',
    strategyReportHeader: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"] div[class^="ka-table-wrapper"] table thead > tr > th',
    strategyReportRow: '#bottom-area div[class^="backtesting"] div[class^="wrapper-"] div[class^="ka-table-wrapper"] table tbody > tr[class^="ka-tr"]:not([class*="ka-no-data-row"])',
}

const sw = {
    newStrategyView: null
}

sw.init = async () => {
    console.log('init selectorWrapper')
    await util.openStrategyTab();
    let deepCheckbox = document.querySelector(SEL.strategyDeepTestCheckbox)
    if (deepCheckbox.checked) {
        deepCheckbox.click()
        await page.waitForTimeout(50)
    }

    let tablist = document.getElementById('report-tabs');
    console.log('tablist', tablist)
    if (!tablist) return false;

    // #Performance is the new id, #Performance Summary is the old one
    let tab = document.getElementById('Performance');
    console.log('tab', tab)
    sw.newStrategyView = tab !== null;

    console.log('newStrategyView', sw.newStrategyView)
}

sw.strategySummeryTab = () => {
    return sw.newStrategyView ? SEL2.strategySummary : SEL.strategySummary;
}

sw.strategySummeryTabActive = () => {
    return sw.newStrategyView ? SEL2.strategySummaryActive : SEL.strategySummaryActive;
}

sw.strategyReportObserveArea = () => {
    return sw.newStrategyView ? SEL2.strategyReportObserveArea : SEL.strategyReportObserveArea;
}

sw.strategyReportInProcess = () => {
    return sw.newStrategyView ? SEL2.strategyReportInProcess : SEL.strategyReportInProcess;
}

sw.strategyReportReady = () => {
    return sw.newStrategyView ? SEL2.strategyReportReady : SEL.strategyReportReady;
}

sw.strategyReportError = () => {
    return sw.newStrategyView ? SEL2.strategyReportError : SEL.strategyReportError;
}

sw.strategyReportHeader = () => {
    return sw.newStrategyView ? SEL2.strategyReportHeader : SEL.strategyReportHeader;
}

sw.strategyReportRow = () => {
    return sw.newStrategyView ? SEL2.strategyReportRow : SEL.strategyReportRow;
}

sw.strategyReportDeepTestReady = () => {
    return sw.newStrategyView ? SEL2.strategyReportReady : SEL.strategyReportDeepTestReady;
}

sw.strategyReportDeepTestObserveArea = () => {
    return sw.newStrategyView ? SEL2.strategyReportObserveArea : SEL.strategyReportDeepTestObserveArea;
}

sw.strategyReportDeepTestInProcess = () => {
    return sw.newStrategyView ? SEL2.strategyReportInProcess : SEL.strategyReportDeepTestInProcess;
}

sw.strategyReportDeepTestHeader = () => {
    return sw.newStrategyView ? SEL2.strategyReportHeader : SEL.strategyReportDeepTestHeader;
}

sw.strategyReportDeepTestRow = () => {
    return sw.newStrategyView ? SEL2.strategyReportRow : SEL.strategyReportDeepTestRow;
}

sw.indicatorPropertyContent = () => {
    return sw.newStrategyView ? SEL2.indicatorPropertyContent : SEL.indicatorPropertyContent;
}

sw.strategyDialogParam = () => {
    return sw.newStrategyView ? SEL.strategyCaption : SEL.strategyDialogParam;
}