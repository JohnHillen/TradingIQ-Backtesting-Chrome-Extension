/*
 @license Copyright 2021 akumidv (https://github.com/akumidv/)
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const TF_UNIT_LIST = ['s', 'm', 'h', 'D', 'W', 'M', 'r']
let currentIqId = 'impulsIq'

const CSL_INFO = `Comma seperated list of single values and ranges. Ranges are defined by a dash.<br><br>
The first value of a range defines the step size.<br>
(0.1-0.4 will have a step size of 0.1 and will generate a list of 0.1,0.2,0.3,0.4)<br>
Optional the step size can be defined by a ':',<br>
eg: (0-5:2) will be converted to 0,2,4,5.<br><br>
If the last value of a range is not a multiple of the step size, the last value will be
included in the list. (0.2-0.5 -> 0.2,0.4,0.5)<br><br>
If you want to define a range that starts at 0, define something like 0,1-5 or 0-5:1<br><br>
You can combine single values and different ranges.
e.g.<br>
0.1,0.2,0.4-1.2,1-5,2-11 will be converted to the following list:<br>
single values: 0.1,0.2<br>
range: 0.4-1.2 -> 0.4,0.8,1.2<br>
range: 1-5 -> 1,2,3,4,5<br>
range: 2-11 -> 2,4,6,8,10,11<br>
final: 0.1,0.2, 0.4,0.8,1,1.2, 2,3,4,5,6,8,10,11`

document.addEventListener('DOMContentLoaded', () => {
  checkIsTVChart()
  loadSettings()

  fetch("../manifest.json")
    .then(response => response.json())
    .then(json => document.getElementById('version').innerText = 'Version ' + json.version);

  document.onmouseleave = function () {
    saveSettings()
  }
  document.getElementById("Settings").onmouseleave = function () {
    saveSettings()
  }
  let debounceTimeout;
  document.addEventListener('change', (event) => {
    if (event.target.closest('input, select')) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(calcNumberOfBacktests, 350);
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.closest('input')) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(calcNumberOfBacktests, 350);
    }
  });


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
});

function showHint(parentNode, elementId, text, autoHide = true) {
  console.log('showHint')
  const hint = document.createElement('div');
  hint.id = elementId + '_hint';
  hint.className = 'hint';
  hint.style.color = 'red';
  hint.innerText = text;
  parentNode.appendChild(hint);

  if (autoHide) {
    setTimeout(() => {
      hint.remove();
    }, 6000);
  }
}

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
      }
    } catch (e) {
      console.error(e)
    }
  });
}

/**
 * Parses a string representing a range of numbers and returns a formatted string of the range.
 *
 * The input string can contain individual numbers, ranges (e.g., "1-5"), and ranges with steps (e.g., "1-5:0.5").
 *
 * @param {string} val - The input string representing the range of numbers.
 * @returns {string|Object} - A comma-separated string of numbers in the range, or an object with an error property if invalid.
 *
 * @example
 * // Returns "1,2,3,4,5"
 * parseRange("1-5");
 *
 * @example
 * // Returns "0,0.5,1,1.5,2,2.5,3"
 * parseRange("0-3:0.5");
 *
 * @example
 * // Returns "1,2,3,4,5,7,8,9"
 * parseRange("1-5,7-9");
 *
 * @example
 * // Returns { error: 'invalid: 1-5:0' }
 * parseRange("1-5:0");
 */
function parseRange(val) {
  let parts = val.split(',').filter(part => part.trim() !== '');
  let result = [];

  try {
    parts.forEach(part => {
      if (!/\d$/.test(part)) {
        part = part.slice(0, -1);
      }
      if (part.includes('-')) {
        let [start, end] = part.replace(/:.*$/g, '').split('-').map(Number);
        if (start > end) [start, end] = [end, start];
        let step = part.includes(':') ? parseFloat(part.split(':')[1]) : start;
        let decimalPlaces = (step.toString().split('.')[1] || '').length;
        if (step > 0) {
          for (let i = start; i <= end; i += step) {
            result.push(i.toFixed(decimalPlaces));
          }
          if (result[result.length - 1] != end.toFixed(decimalPlaces)) {
            result.push(end.toFixed(decimalPlaces));
          }
        } else {
          result.error = 'invalid: ' + part;
          return result
        }
      } else {
        let decimalPlaces = (part.split('.')[1] || '').length;
        result.push(parseFloat(part).toFixed(decimalPlaces));
      }
    });
  } catch (ignore) {
    console.error(ignore);
  }

  return result.error === undefined ? [...new Set(result)].join(',') : result;
}

function calcNumberOfBacktests() {
  console.log('calcNumberOfBacktests');
  let numberOfBacktests = 0;
  let iqParameters = getIqParameter();
  let countArr = [];

  for (let key in iqParameters) {
    if (iqParameters.hasOwnProperty(key)) {
      let elVal = iqParameters[key];
      console.log('calcNumberOfBacktests elVal', elVal)
      if (document.getElementById(key).type === 'text') {
        if (elVal.error === null) {
          elVal = parseRange(elVal.value);
        }
        if (elVal.error) {
          document.getElementById('warningDiv').style.display = 'block';
          document.getElementById('warningMsg').innerText = elVal.error;
          document.getElementById('testStrategy').disabled = true;
          return
        }
      }
      else {
        elVal = elVal.value;
      }
      let commaCount = elVal === true || elVal === false ? 1 : (elVal.match(/,/g) || []).length + 1;
      if (elVal.length > 0) {
        countArr.push(commaCount);
      }
    }
  }

  initFileName()
  let tfList = parseTfList();
  if (tfList.error) {
    return
  }

  tfList = tfList.data.toString();
  let commaCount = (tfList.match(/,/g) || []).length + 1;
  if (tfList.length > 0) {
    countArr.push(commaCount);
  }
  let exchangeEl = document.getElementById('exchanges');
  if (exchangeEl.disabled === false) {
    let exchanges = exchangeEl.value;
    commaCount = (exchanges.match(/,/g) || []).length + 1;
    if (exchanges.length > 0) {
      countArr.push(commaCount);
    }
  }
  if (countArr.length > 0) {
    numberOfBacktests = countArr.reduce((acc, val) => acc * val, 1);
  }
  document.getElementById('numberOfBacktests').innerText = numberOfBacktests == 0 ? 1 : numberOfBacktests;
}

function parseTfList() {
  let tfList = document.getElementById('tfList').value;
  tfList = util.normalize(tfList);
  tfList = util.parseTfList(tfList)
  console.log('tfList', tfList)
  if (tfList.error) {
    document.getElementById('warningDiv').style.display = 'block';
    document.getElementById('warningMsg').innerText = tfList.error;
    document.getElementById('testStrategy').disabled = true;
    return tfList
  }

  document.getElementById('warningDiv').style.display = 'none';
  document.getElementById('testStrategy').disabled = false;
  if (tfList.data.length === 0) {
    tfList.data = ['CURRENT_TF']
  }
  return tfList
}

function getStrategyCycles() {
  let exchangeEl = document.getElementById('exchanges');
  let exchanges = ['NA'];
  if (exchangeEl.disabled === false) {
    exchanges = exchangeEl.value;
    exchanges = util.normalizeExchange(exchanges);
    exchanges = exchanges.length === 0 ? ['NA'] : exchanges.split(',');
  }

  let tfList = parseTfList();
  if (tfList.error) {
    return
  }
  let iqParameters = getIqParameter();
  let cycles = [];

  // Iterate over exchanges first
  exchanges.forEach(exchange => {
    // Iterate over tfList and iqParameters to get all possible combinations
    tfList.data.forEach(tf => {
      let keys = Object.keys(iqParameters);
      let combinations = [{}];

      keys.forEach(key => {
        let iqValue = iqParameters[key].value;
        if (document.getElementById(key).type === 'text') {
          iqValue = parseRange(iqValue);
        } else if (iqValue === true || iqValue === false) {
          iqValue = iqValue.toString();
        }
        let values = iqValue.split(',');
        let tempCombinations = [];

        combinations.forEach(combination => {
          values.forEach(value => {
            let newCombination = { ...combination };
            if (key === 'impulsIq_rr') {
              let rrVal = newCombination[constants['impulsIq_rr']];
              newCombination[constants['impulsIq_rr']] = { adaptive: true, value1: rrVal, value2: value };
            }
            else if (key === 'novaIq_trade_trends_reversions') {
              newCombination[constants['novaIq_trade_trends']] = value.includes('&') ? true : value === 'Trends';
              newCombination[constants['novaIq_trade_reversions']] = value.includes('&') ? true : value === 'Reversions';
            }
            else {
              newCombination[constants[key]] = parseValue(value);
            }
            tempCombinations.push(newCombination);
          });
        });

        combinations = tempCombinations;
      });

      combinations.forEach(combination => {
        let newCombination = { ...combination };
        newCombination['tf'] = tf;
        newCombination['exchange'] = exchange.toUpperCase();
        cycles.push(newCombination);
      });
    });
  });
  console.log('cycles', cycles);
  return cycles;
}

function parseValue(value) {
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return value.toLowerCase() === 'true';
  } else if (value.toLowerCase() === 'on' || value.toLowerCase() === 'off') {
    return value.toLowerCase() === 'on';
  }
  return value;
}

function getIqParameter() {
  let iqSettings = document.querySelectorAll('[data-name="iqSettings"]')
  let iqParrameter = {}
  for (let i = 0; i < iqSettings.length; i++) {
    let element = iqSettings[i]
    if (!element.id.includes(currentIqId)) {
      continue
    }
    if (ignoreParameter(element.id)) {
      continue
    }
    if (element.tagName.toLowerCase() === 'input' && element.type === 'checkbox') {
      iqParrameter[element.id] = { value: element.checked, error: null };
    }
    else if (element.tagName.toLowerCase() === 'input' && element.value.length > 0) {
      let dataMin = element.hasAttribute('data-min') ? parseFloat(element.getAttribute('data-min')) : null;
      let error = dataMin === null ? null : dataMin > parseFloat(element.value) ? `'${constants[element.id]}': Minimum value is ${dataMin}` : null;
      iqParrameter[element.id] = { value: util.normalize(element.value), error: error };
    }
    else if (element.tagName.toLowerCase() === 'select' && element.options[element.selectedIndex].text !== 'select...') {
      iqParrameter[element.id] = { value: util.normalize(element.options[element.selectedIndex].text), error: null };
    }
  }
  return iqParrameter
}

function ignoreParameter(elementId) {
  switch (elementId) {
    case 'counterIq_ema_length':
      return document.getElementById('counterIq_use_ema_filter').value === '1'; // 1 is False
    case 'impulsIq_rr':
      return document.getElementById('impulsIq_rr_on_off').value === '1'; // 1 is False
  }
  return false;
}

function loadSettings() {
  console.log('loadSettings');

  chrome.storage.local.get('tiqSettings', (getResults) => {
    console.log('load tiqSettings, ', getResults)
    if (getResults.hasOwnProperty('tiqSettings')) {
      const settings = getResults['tiqSettings']
      if (settings.hasOwnProperty('iqIndicator')) {
        let iqIndicator = document.getElementById('iqIndicator');
        iqIndicator.value = settings['iqIndicator']
        currentIqId = customSelect.indicatorChange(iqIndicator)
      }
      console.log('settings', settings)
      for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
          console.log('settings[key]', settings[key], 'key', key)
          const element = document.getElementById(key);
          if (element) {
            if (element.type === 'checkbox') {
              element.checked = settings[key]
            } else {
              element.value = settings[key]
            }
          }
        }
      }
    }
    if (!document.getElementById('iq_enable_exchanges').checked) {
      document.getElementById('exchanges').disabled = true
      disable('exchanges')
    }

    if (!document.getElementById('iq_deep_enabled').checked) {
      document.getElementById('iq_deep_from').disabled = true
      document.getElementById('iq_deep_to').disabled = true
      disable('iq_deep_from')
      disable('iq_deep_to')
    }

    initFileName();
    calcNumberOfBacktests()
    customSelect.init()

    let tfEl = document.getElementById('tfList').value
    let tfResult = util.parseTfList(tfEl)
    console.log('tfResult', tfResult)
  });
}

function getElementValueById(id) {
  let element = document.getElementById(id);
  if (!element) {
    return null
  }
  return element.type === 'checkbox' ? element.checked : element.value
}

function saveSettings() {
  console.log('saveSettings');

  const settings = {}
  let iqSettings = document.querySelectorAll('[data-name="iqSettings"]')
  let strategySettings = document.querySelectorAll('[data-name="strategySettings"]')

  let allSettings = [...iqSettings, ...strategySettings]
  for (let i = 0; i < allSettings.length; i++) {
    let element = allSettings[i]
    if (element.type === 'checkbox') {
      settings[element.id] = element.checked
    } else {
      settings[element.id] = element.value
    }
  }

  console.log('settings', settings)
  chrome.storage.local.set({ 'tiqSettings': settings })
}

function disable(elId) {
  try {
    document.getElementById(elId).classList.toggle('disabled')
  } catch (e) {
  }
}

function getStrategyProperties() {
  let strategySettings = document.querySelectorAll('[data-name="strategySettings"]')
  let strategyProperties = {}
  let previousKey = null
  for (let i = 0; i < strategySettings.length; i++) {
    let element = strategySettings[i]
    let key = constants[element.id]
    if (!key) {
      continue
    }

    if (element.type === 'checkbox') {
      strategyProperties[key] = element.checked
    } else if (element.hasAttribute('data-adaptive')) {
      strategyProperties[previousKey] = element.hasAttribute('data-adaptive') ? { value1: strategyProperties[previousKey], value2: element.options[element.selectedIndex].text } : element.value
    } else if (element.tagName.toLowerCase() === 'select') {
      strategyProperties[key] = element.options[element.selectedIndex].text
    } else {
      strategyProperties[key] = element.value
    }
    previousKey = key
  }
  return strategyProperties
}

function getPfFilter() {
  let checked = document.getElementById('iq_enable_pf_filter').checked
  let filter = {}
  filter.long = !checked ? 0 : document.getElementById('iq_pf_long').valueAsNumber
  filter.short = !checked ? 0 : document.getElementById('iq_pf_short').valueAsNumber
  filter.operator = document.getElementById('iq_pf_operator').selectedIndex
  filter.enabled = checked
  return filter
}

function getTestOptions() {
  const options = {}
  options.iqIndicator = SUPPORTED_STRATEGIES[document.getElementById('iqIndicator').value]
  options.strategyProperties = getStrategyProperties()
  options.deeptest = document.getElementById('iq_deep_enabled').checked
  options.resetAtStart = document.getElementById('iq_reset_at_start').checked
  options.isNovaTrendSelected = document.getElementById('novaIq_trade_trends_reversions').selectedIndex !== 2 // 1 = Trends, 2 = Reversions
  options.isNovaReversionSelected = document.getElementById('novaIq_trade_trends_reversions').selectedIndex !== 1 // 1 = Trends, 2 = Reversions
  options.pfFilter = getPfFilter()
  options.fileName = initFileName()
  if (options.deeptest) {
    options.deepfrom = document.getElementById('iq_deep_from').value
    options.deepto = document.getElementById('iq_deep_to').value
  }
  options.cycles = getStrategyCycles()
  options.timeout = document.getElementById('tiq_timeout').value
  if (!options.timeout) {
    options.timeout = 60
  }
  options.retry = document.getElementById('tiq_retry').value
  if (!options.retry) {
    options.retry = 5
  }
  let rfHtml = document.getElementById('reportResultOptionsHtml').checked
  let rfCsv = document.getElementById('reportResultOptionsCsv').checked
  let htmlEquityChart = document.getElementById('htmlEquityChartOnOff').checked
  options.reportResultOptions = { 'html': rfHtml, 'csv': rfCsv, 'htmlEquityChart': htmlEquityChart }
  return options
}

function initFileName() {
  let fileName = document.getElementById('customFileName').value.trim()
  let dateTime = new Date().toISOString()
  let strategyName = SUPPORTED_STRATEGIES[document.getElementById('iqIndicator').value].split('Backtester')[0].trim().replace(/\s+/g, '-');
  if (fileName.length === 0) {
    dateTime = dateTime.split('.')[0].replace(/[:.]/g, '-');
    fileName = strategyName + '_' + dateTime;
  } else {
    fileName = fileName.replace('{indicator}', strategyName);
    fileName = fileName.replace('{indicator-short}', SHORT_INDIICATORS[document.getElementById('iqIndicator').value]);
    let tfList = parseTfList();
    if (tfList.error) {
      return
    }
    if (tfList.data.length === 1) {
      fileName = fileName.replace('{tf}', tfList.data[0]);
    } else {
      fileName = fileName.replace('{tf}', `${tfList.data[0]}-${tfList.data[tfList.data.length - 1]}`);
    }
    const date = dateTime.split('T')[0];
    fileName = fileName.replace('{date}', date);
    const time = dateTime.split('T')[1].split('.')[0].replace(/[:.]/g, '-');
    fileName = fileName.replace('{time}', time);

    if (fileName.endsWith('.csv')) {
      fileName = fileName.substring(0, fileName.length - 4);
    } else if (fileName.endsWith('.html')) {
      fileName = fileName.substring(0, fileName.length - 5);
    }
    const illegalChars = /[\/\\?*:|<>]/g;
    fileName = fileName.replace(illegalChars, '');
    fileName = fileName.replace(/\s+/g, '-'); // Replace spaces with hyphens

    const platform = navigator.userAgentData.platform.toLowerCase;
    const hintElem = document.getElementById('customFileName_hint')
    if (fileName.length > 255 && platform && (platform.startsWith('mac') || platform.startsWith('ios') || platform.startsWith('linux'))) {
      if (!hintElem) {
        showHint(document.getElementById('customFileName').parentNode, 'customFileName', 'The length of the file name is greater than 255, this may not be supported by your platform.', false);
      }
    } else if (hintElem) {
      hintElem.remove();
    }

    // EXCHANGES
    if (fileName.includes('{exchanges}')) {
      let exchangeEl = document.getElementById('exchanges');
      let exchangeStr = util.getExchangeString(exchangeEl);
      fileName = fileName.replace('{exchanges}', exchangeStr);
    }
  }
  document.getElementById('customFileName-Preview').innerText = 'Preview: ' + fileName;
  return fileName
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

