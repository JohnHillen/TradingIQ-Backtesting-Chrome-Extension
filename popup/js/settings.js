

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

    if (document.getElementById('iq_test_date_range_type').value !== '6') {
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

function getIqParameter() {
  let iqSettings = document.querySelectorAll('[data-name="iqSettings"]');
  let isImpulsIq = currentIqId === 'impulsIq';
  let impulsIq_link_toggle = document.getElementById('impulsIq_link_toggle')?.classList.contains('active');
  let isReversalIq = currentIqId === 'reversalIq';
  let reversalIq_link_toggle = document.getElementById('reversalIq_link_toggle')?.classList.contains('active');
  let isCounterIq = currentIqId === 'counterIq';
  let counterIq_link_toggle = document.getElementById('counterIq_link_toggle')?.classList.contains('active');
  let isNovaIq = currentIqId === 'novaIq';
  let novaIq_link_toggle = document.getElementById('novaIq_link_toggle')?.classList.contains('active');

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
    else if (isImpulsIq && impulsIq_link_toggle && (element.id === 'impulsIq_ltf' || element.id === 'impulsIq_htf')) {
      if (element.id === 'impulsIq_htf') {
        continue;
      }
      let linkValue = getLinkValue('impulsIq_ltf', 'impulsIq_htf', 'Chart', true);
      if (linkValue.error) {
        showWarning(linkValue.error, linkValue.errorElId);
        return null;
      }

      if (linkValue) {
        iqParrameter['impulsIq_ltf_htf_link'] = linkValue;
      }
    }
    else if (isReversalIq && reversalIq_link_toggle && (element.id === 'reversalIq_min_atr_profit' || element.id === 'reversalIq_min_atr_stop')) {
      if (element.id === 'reversalIq_min_atr_stop') {
        continue;
      }
      let linkValue = getLinkValue('reversalIq_min_atr_profit', 'reversalIq_min_atr_stop', 'null');
      if (linkValue.error) {
        showWarning(linkValue.error, linkValue.errorElId);
        return null;
      }

      if (linkValue) {
        iqParrameter['reversalIq_min_atr_link'] = linkValue;
      }
    }
    else if (isCounterIq && counterIq_link_toggle && (element.id === 'counterIq_min_atr_profit' || element.id === 'counterIq_min_atr_stop')) {
      if (element.id === 'counterIq_min_atr_stop') {
        continue;
      }
      let linkValue = getLinkValue('counterIq_min_atr_profit', 'counterIq_min_atr_stop', 'null');
      if (linkValue.error) {
        showWarning(linkValue.error, linkValue.errorElId);
        return null;
      }

      if (linkValue) {
        iqParrameter['counterIq_min_atr_link'] = linkValue;
      }
    }
    else if (isNovaIq && novaIq_link_toggle && (element.id === 'novaIq_min_atr_profit' || element.id === 'novaIq_min_atr_stop')) {
      if (element.id === 'novaIq_min_atr_stop') {
        continue;
      }
      let linkValue = getLinkValue('novaIq_min_atr_profit', 'novaIq_min_atr_stop', 'null');
      if (linkValue.error) {
        showWarning(linkValue.error, linkValue.errorElId);
        return null;
      }

      if (linkValue) {
        iqParrameter['novaIq_min_atr_link'] = linkValue;
      }
    }
    else if (element.tagName.toLowerCase() === 'input' && element.value.length > 0) {
      let dataMin = element.hasAttribute('data-min') ? parseFloat(element.getAttribute('data-min')) : null;
      let error = null;
      if (dataMin !== null) {
        let minValue = element.value.includes(',') ? Math.min(...parseRange(element.value).split(',')) : parseFloat(element.value);
        error = dataMin > minValue ? `'${constants[element.id]}': Minimum value is ${dataMin}` : null;
      }
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
