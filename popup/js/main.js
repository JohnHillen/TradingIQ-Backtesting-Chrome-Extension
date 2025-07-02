function checkIsTVChart() {
    console.log('checkIsTVChart')

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('tabs', tabs)
        try {
            let isTVTab = tabs[0].url.includes('tradingview.com')
            let isEnglish = tabs[0].url.includes('www.tradingview.com') || tabs[0].url.includes('https://tradingview.com')
            document.getElementById("unsupportedPage").style.display = (isTVTab && isEnglish) ? 'none' : 'block'
            document.getElementById("supportedPage").style.display = !(isTVTab && isEnglish) ? 'none' : 'block'
            document.getElementById("disclaimer").style.display = !(isTVTab && isEnglish) ? 'none' : 'block'
            document.getElementById("settingBtn").style.display = !(isTVTab && isEnglish) ? 'none' : 'block'

            if (isTVTab && isEnglish) {
                document.getElementById("testStrategy").addEventListener('click', function () { startTest() })
                document.getElementById("settingBtn").addEventListener('click', function () { showSettings() })
                document.getElementById('iqIndicator').addEventListener("change", event => {
                    currentIqId = customSelect.indicatorChange(event.target)
                    initFileName()
                });
                document.getElementById('iq_enable_exchanges').addEventListener('click', function () {
                    document.getElementById('exchanges').disabled = !document.getElementById('iq_enable_exchanges').checked
                    disable('exchanges')
                    calcNumberOfBacktests()
                });

                // Add event listeners for all plus and minus buttons
                document.querySelectorAll('.custom-buttons .plus, .custom-buttons .minus').forEach(button => {
                    button.addEventListener('click', () => {
                        const input = button.parentNode.previousElementSibling;
                        if (input && input.type === 'number') {
                            button.classList.contains('plus') ? input.stepUp() : input.stepDown();
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                });

                document.querySelectorAll('[id$="_link_toggle"]').forEach(toggle => {
                    toggle.addEventListener('click', function () {
                        console.log(`${this.id} clicked`);
                        this.classList.toggle('active');
                        calcNumberOfBacktests();
                    });
                });

                document.getElementById('iq_deep_enabled').addEventListener('click', function () {
                    document.getElementById('iq_deep_from').disabled = !document.getElementById('iq_deep_enabled').checked
                    document.getElementById('iq_deep_to').disabled = !document.getElementById('iq_deep_enabled').checked
                    disable('iq_deep_from')
                    disable('iq_deep_to')
                });

                let cslList = document.querySelectorAll('[data-info="csl"]')
                for (let i = 0; i < cslList.length; i++) {
                    cslList[i].innerHTML = CSL_INFO
                }

                let tfList = document.querySelectorAll('[data-info="tflist"]')
                for (let i = 0; i < tfList.length; i++) {
                    tfList[i].innerHTML = TIMEFRAME_INPUT
                }
            }
        } catch (e) {
            console.error(e)
        }
    });
}

function startTest() {
    console.log('startTest')
    let msgOptions = null
    msgOptions = getTestOptions()

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const message = { action: 'testStrategy', options: msgOptions }
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            if (response === undefined) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'custom-alert';
                alertDiv.innerText = 'Please reload the tradingview page and try again.';
                document.body.appendChild(alertDiv);

                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            } else {
                window.close()
            }
        });
    });
}

function showSettings() {
    let settings = document.getElementById("Settings");
    let mainDiv = document.getElementById("supportedPage");
    let disclaimer = document.getElementById("disclaimer");
    if (settings.style.display === "block") {
        settings.style.display = "none";
        mainDiv.style.filter = "";
        disclaimer.style.filter = "";
    } else {
        mainDiv.style.filter = "blur(8px)";
        disclaimer.style.filter = "blur(8px)";
        settings.style.display = "block";
    }
}

function attachDynamicEventListeners() {
    document.getElementById('customFileName').addEventListener('input', function () {
        const illegalChars = /[\/\\?*:|<>]/g;
        if (illegalChars.test(this.value)) {
            this.value = this.value.replace(illegalChars, '');
            showHint(this.parentNode, 'customFileName', 'The following characters are not allowed: / \\ ? * : | < >');
        }
        initFileName();
    });

    let dateTo = document.getElementById('iq_deep_to');
    dateTo.max = new Date().toISOString().split('T')[0];

    document.getElementById("Settings").onmouseleave = function () {
        saveSettings()
    }
}

function showWarning(message, elementId) {
    console.log('showWarning', elementId, message)
    let element = document.getElementById(elementId);
    let warningDivId = element.dataset.warnId;
    let warningDiv = document.getElementById(warningDivId);
    warningDiv.style.display = 'block';
    warningDiv.querySelector('#warningMsg').innerText = message;
    document.getElementById('testStrategy').disabled = true;
}

const WARNING_DIV_TF_LIST = 'main-tf-warning';
const WARNING_DIV_IMPULS_IQ_LTF = 'impulsIq_ltf_warning';
const WARNING_DIV_IMPULS_IQ_HTF = 'impulsIq_htf_warning';
const WARNING_DIV_REVERSAL_IQ_MIN_ATR_PROFIT = 'reversalIq_min_atr_profit_warning';
const WARNING_DIV_REVERSAL_IQ_MIN_ATR_STOP = 'reversalIq_min_atr_stop_warning';
const WARNING_DIV_COUNTER_IQ_MIN_ATR_PROFIT = 'counterIq_min_atr_profit_warning';
const WARNING_DIV_COUNTER_IQ_MIN_ATR_STOP = 'counterIq_min_atr_stop_warning';
const WARNING_DIV_NOVA_IQ_MIN_ATR_PROFIT = 'novaIq_min_atr_profit_warning';
const WARNING_DIV_NOVA_IQ_MIN_ATR_STOP = 'novaIq_min_atr_stop_warning';

function hideWarning(warningDivId) {
    console.log('hideWarning', warningDivId)
    document.getElementById(warningDivId).style.display = 'none';
    document.getElementById('testStrategy').disabled = false;
}

function hideAllWarnings() {
    console.log('hideAllWarnings')
    hideWarning(WARNING_DIV_TF_LIST);
    hideWarning(WARNING_DIV_IMPULS_IQ_LTF);
    hideWarning(WARNING_DIV_IMPULS_IQ_HTF);
    hideWarning(WARNING_DIV_REVERSAL_IQ_MIN_ATR_PROFIT);
    hideWarning(WARNING_DIV_REVERSAL_IQ_MIN_ATR_STOP);
    hideWarning(WARNING_DIV_COUNTER_IQ_MIN_ATR_PROFIT);
    hideWarning(WARNING_DIV_COUNTER_IQ_MIN_ATR_STOP);
    hideWarning(WARNING_DIV_NOVA_IQ_MIN_ATR_PROFIT);
    hideWarning(WARNING_DIV_NOVA_IQ_MIN_ATR_STOP);
}
