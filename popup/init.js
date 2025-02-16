/*
 @license Copyright 2021 akumidv (https://github.com/akumidv/)
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const TF_UNIT_LIST = ['s', 'm', 'h', 'D', 'W', 'M', 'r']
let currentIqId = 'impulsIq'

document.addEventListener('DOMContentLoaded', () => {
  checkIsTVChart()
  loadSettings()

  document.onmouseleave = function () {
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
});

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
      }
    } catch (e) {
      console.error(e)
    }
  });
}

function parseRange(val) {
  let parts = val.split(',').filter(part => part.trim() !== '');
  let result = [];

  try {
    parts.forEach(part => {
      if (!/\d$/.test(part)) {
        part = part.slice(0, -1);
      }
      if (part.includes('-')) {
        let [start, end] = part.split('-').map(Number);
        if (start > end) [start, end] = [end, start];
        let decimalPlaces = (start.toString().split('.')[1] || '').length;
        let step = start;
        if (step > 0) {
          for (let i = start; i <= end; i += step) {
            result.push(i.toFixed(decimalPlaces));
          }
          if (result[result.length - 1] != end.toFixed(decimalPlaces)) {
            result.push(end.toFixed(decimalPlaces));
          }
        } else {
          result.error = 'Range start value must be greater than 0: ' + part;
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
      let commaCount = (elVal.match(/,/g) || []).length + 1;
      if (elVal.length > 0) {
        countArr.push(commaCount);
      }
    }
  }

  let tfList = document.getElementById('tfList').value;
  tfList = util.normalize(tfList);
  tfList = util.parseTfList(tfList)
  if (tfList.error) {
    document.getElementById('warningDiv').style.display = 'block';
    document.getElementById('warningMsg').innerText = tfList.error;
    document.getElementById('testStrategy').disabled = true;
    return
  }

  document.getElementById('warningDiv').style.display = 'none';
  document.getElementById('testStrategy').disabled = false;

  tfList = tfList.data.toString();
  let commaCount = (tfList.match(/,/g) || []).length + 1;
  if (tfList.length > 0) {
    countArr.push(commaCount);
  }

  if (countArr.length > 0) {
    numberOfBacktests = countArr.reduce((acc, val) => acc * val, 1);
  }
  document.getElementById('numberOfBacktests').innerText = numberOfBacktests == 0 ? 1 : numberOfBacktests;
}

function getStrategyCycles() {
  let tfList = document.getElementById('tfList').value;
  tfList = util.normalize(tfList);
  tfList = util.parseTfList(tfList)
  console.log('tfList', tfList)
  if (tfList.error) {
    document.getElementById('warningDiv').style.display = 'block';
    document.getElementById('warningMsg').innerText = tfList.error;
    document.getElementById('testStrategy').disabled = true;
    return
  }
  if (tfList.data.length === 0) {
    tfList.data = ['CURRENT_TF']
  }
  let iqParameters = getIqParameter();
  let cycles = [];

  // Iterate over tfList and iqParameters to get all possible combinations
  tfList.data.forEach(tf => {
    let keys = Object.keys(iqParameters);
    let combinations = [{}];

    keys.forEach(key => {
      let iqValue = iqParameters[key].value;
      if (document.getElementById(key).type === 'text') {
        iqValue = parseRange(iqValue);
      }
      let values = iqValue.split(',');
      let tempCombinations = [];

      combinations.forEach(combination => {
        values.forEach(value => {
          let newCombination = { ...combination };
          if (key === 'impulsIq_rr') {
            let rrVal = newCombination[constants['impulsIq_rr']];
            newCombination[constants['impulsIq_rr']] = { adaptive: true, value1: rrVal, value2: value };
          } else {
            newCombination[constants[key]] = (value === 'True' || value === 'False') ? (value === 'True') : value;
          }
          tempCombinations.push(newCombination);
        });
      });

      combinations = tempCombinations;
    });

    combinations.forEach(combination => {
      combination['tf'] = tf;
      cycles.push(combination);
    });
  });
  console.log('cycles', cycles);
  return cycles;
}

function getIqParameter() {
  let iqSettings = document.querySelectorAll('[data-name="iqSettings"]')
  let iqParrameter = {}
  for (let i = 0; i < iqSettings.length; i++) {
    let element = iqSettings[i]
    if (!element.id.includes(currentIqId)) {
      continue
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

    if (!document.getElementById('iq_deep_enabled').checked) {
      document.getElementById('iq_deep_from').disabled = true
      document.getElementById('iq_deep_to').disabled = true
      disable('iq_deep_from')
      disable('iq_deep_to')
    }

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

function getTestOptions() {
  const options = {}
  options.iqIndicator = SUPPORTED_STRATEGIES[document.getElementById('iqIndicator').value]
  options.strategyProperties = getStrategyProperties()
  options.deeptest = document.getElementById('iq_deep_enabled').checked
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
  let rfHtml = document.getElementById('reportFormatHtml').checked
  let rfCsv = document.getElementById('reportFormatCsv').checked
  options.reportFormat = { 'html': rfHtml, 'csv': rfCsv }
  return options
}

function startTest() {
  console.log('startTest')
  let msgOptions = null
  msgOptions = getTestOptions()

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = { action: 'testStrategy', options: msgOptions }
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (response === undefined) {
        alert('Please reload the page and try again.')
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

