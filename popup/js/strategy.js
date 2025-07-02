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

function getStrategyCycles() {
  let exchangeEl = document.getElementById('exchanges');
  let exchanges = ['NA'];

  if (exchangeEl.disabled === false) {
    exchanges = exchangeEl.value;
    exchanges = util.normalizeExchange(exchanges);
    exchanges = exchanges.length === 0 ? ['NA'] : exchanges.split(',');
  }

  let tfList = parseTfList(['tfList'], ['CURRENT_TF']);
  if (tfList.error) {
    return;
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
        let element = document.getElementById(key);
        if (element?.type === 'text' && element?.dataset.type === 'tfList') {
          iqValue = parseTfList([key]);
          if (iqValue.data) {
            iqValue = iqValue.data.toString();
          }
        } else if (element?.type === 'text') {
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
            else if (key.endsWith('_link')) {
              addLinkCombination(newCombination, key, value);
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
function addLinkCombination(newCombination, key, value) {
  let linkVal = value.split(':');
  let key1;
  let key2;

  if (key === 'impulsIq_ltf_htf_link') {
    key1 = constants['impulsIq_ltf'];
    key2 = constants['impulsIq_htf'];
  }
  else if (key === 'reversalIq_min_atr_link') {
    key1 = constants['reversalIq_min_atr_profit'];
    key2 = constants['reversalIq_min_atr_stop'];
  }
  else if (key === 'counterIq_min_atr_link') {
    key1 = constants['counterIq_min_atr_profit'];
    key2 = constants['counterIq_min_atr_stop'];
  }
  else if (key === 'novaIq_min_atr_link') {
    key1 = constants['novaIq_min_atr_profit'];
    key2 = constants['novaIq_min_atr_stop'];
  }

  if (linkVal[0] !== 'null') {
    newCombination[key1] = linkVal[0];
  }
  if (linkVal[1] !== 'null') {
    newCombination[key2] = linkVal[1];
  }
}
function getTestOptions() {
  const options = {}
  options.iqIndicator = SUPPORTED_STRATEGIES[document.getElementById('iqIndicator').value]
  options.strategyProperties = getStrategyProperties()
  options.deeptest = document.getElementById('iq_deep_enabled').checked
  options.resetAtStart = document.getElementById('iq_reset_at_start').checked
  options.isNovaTrendSelected = document.getElementById('novaIq_trade_trends_reversions').selectedIndex !== 2 // 1 = Trends, 2 = Reversions
  options.isNovaReversionSelected = document.getElementById('novaIq_trade_trends_reversions').selectedIndex !== 1 // 1 = Trends, 2 = Reversions
  options.requiredTimeframes = parseTfList(currentIqId === 'impulsIq' ? ['tfList', 'impulsIq_htf', 'impulsIq_ltf'] : ['tfList']).data;
  console.log('requiredTimeframes', options.requiredTimeframes)
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

function getPfFilter() {
  let checked = document.getElementById('iq_enable_pf_filter').checked
  let filter = {}
  filter.long = !checked ? 0 : document.getElementById('iq_pf_long').valueAsNumber
  filter.short = !checked ? 0 : document.getElementById('iq_pf_short').valueAsNumber
  filter.operator = document.getElementById('iq_pf_operator').selectedIndex
  filter.enabled = checked
  return filter
}
