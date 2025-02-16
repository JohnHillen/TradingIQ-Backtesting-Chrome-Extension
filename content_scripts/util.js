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

util.openPineEditorTab = async () => {
    const strategyTabActive = await page.waitForSelector(SEL.scriptEditorActive, 500)
    if (!strategyTabActive)
        page.mouseClickSelector(SEL.scriptEditorTab)
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

util.getRandomInt = function (max, min) {
    return Math.floor(Math.random() * (45 - 20) + 20)
}

util.normalize = (value) => {
    if (typeof value !== 'string') {
        return value;
    }
    console.log('normalize value', value)
    let result = value.trim(); // remove leading and trailing spaces
    result = result.replace(/[\s,]+$/, ''); // remove trailing spaces and commas
    result = result.replaceAll(', ', ','); // remove spaces after commas
    return result;
}

util.parseTfList = (listOfTF) => {
    let errorMsg = null;
    function fixTf(tf) {
        const supportedSeconds = [1, 5, 10, 15, 30, 45]
        let unit = tf.slice(-1);
        let num = parseInt(tf.slice(0, tf.length - 1));
        switch (unit) {
            case 's':
                if (!supportedSeconds.includes(num)) {
                    errorMsg = `Timeframe value is not supported (${tf}). Supported values for seconds are: ${supportedSeconds.join(', ')}`;
                }
                return tf
            case 'm':
                if (num >= 10000) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for minutes is 9999`;
                } else if (num % 60 === 0) {
                    return (num / 60) + 'h'
                }
                return tf
            case 'h':
            case 'H':
                if (num >= 25) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for hours is 24`;
                }
                return tf
            case 'd':
            case 'D':
                if (num >= 366) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for days is 365`;
                }
                return tf
            case 'w':
            case 'W':
                if (num >= 53) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for weeks is 52`;
                }
                return tf
            case 'M':
                if (num >= 13) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for months is 12`;
                }
                return tf
            case 'R':
                if (num > 999999) {
                    errorMsg = `Timeframe value is too big (${tf}). Max value for range is 999999`;
                }
                return tf
            case '':
                errorMsg = `Please specify a unit for the Timeframe (${tf})`;
                return tf
            default:
                return tf
        }
    }
    if (!listOfTF || typeof listOfTF !== 'string') return { error: null, data: [] };

    let tfList = listOfTF.split(',').reduce((acc, tf) => {
        tf = tf.trim();
        tf = tf.replaceAll('d', 'D').replaceAll('w', 'W').replaceAll('r', 'R').replaceAll('H', 'h').replaceAll('S', 's')
        if (!/[a-zA-Z]$/.test(tf)) {
            errorMsg = `Please specify a unit for the Timeframe (${tf})`;
            return acc;
        }

        tf = tf.length === 1 ? "1" + tf : tf // m -> 1m, D -> 1D...

        if (tf.includes('-')) {
            const [start, end] = tf.split('-').map(t => t.trim());
            const unit = start.slice(-1);
            if (unit !== end.slice(-1)) {
                errorMsg = `Timeframe range must have the same unit: ${tf}`;
                return acc;
            }
            let [startNum, endNum] = [parseInt(start), parseInt(end)];
            if (startNum > endNum) [startNum, endNum] = [endNum, startNum];
            for (let i = startNum; i <= endNum; i++) {
                let newTf = i + unit;
                newTf = fixTf(newTf);
                if (errorMsg)
                    return acc
                acc.push(newTf);
            }
        } else {
            tf = fixTf(tf);
            if (errorMsg)
                return acc
            acc.push(tf);
        }
        return acc;
    }, []);

    if (errorMsg) return { error: errorMsg, data: null };
    tfList = [...new Set(tfList)];
    const validTFs = tfList.filter(tf => /(^\d{1,2}[mhdsDWMR]$)/.test(tf));
    return { error: null, data: validTFs };
}