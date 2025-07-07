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

                document.getElementById('iq_test_date_range_type').addEventListener('change', function (event) {
                    let type = event.target.value;
                    document.getElementById('iq_deep_from').disabled = type !== '6'
                    document.getElementById('iq_deep_to').disabled = type !== '6'
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

                let linkList = document.querySelectorAll('[data-info="link"]')
                for (let i = 0; i < tfList.length; i++) {
                    linkList[i].innerHTML = LINK_LTF_HTF_INFO
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
    let customFileName = document.getElementById('customFileName');
    customFileName.addEventListener('input', function (e) {
        const illegalChars = /[\/\\?*:|<>]/g;
        if (illegalChars.test(this.value)) {
            this.value = this.value.replace(illegalChars, '');
            showHint(this.parentNode, 'customFileName', 'The following characters are not allowed: / \\ ? * : | < >');
        }
        verifyInput(e, customFileName);
        initFileName();
    });
    customFileName.addEventListener('keydown', function (e) {
        const list = document.getElementById('customFileName-autocomplete-list');
        if (!list) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveAutocompleteSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveAutocompleteSelection(-1);
        } else if (e.key === 'Enter') {
            if (selectAutocompleteItem(customFileName)) {
                e.preventDefault();
            }
        } else if (e.key === 'Escape') {
            removeAutocompleteList();
        }
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
    if (!warningDivId) warningDivId = elementId + '_warning';
    let warningDiv = document.getElementById(warningDivId);
    warningDiv.style.display = 'block';
    warningDiv.querySelector('#warningMsg').innerText = message;
    document.getElementById('testStrategy').disabled = true;
}

function hideWarning(warningDivId) {
    console.log('hideWarning', warningDivId)
    document.getElementById(warningDivId).style.display = 'none';
    document.getElementById('testStrategy').disabled = false;
}

function hideAllWarnings() {
    console.log('hideAllWarnings')
    document.querySelectorAll('[id$="_warning"]').forEach(div => hideWarning(div.id));
}
