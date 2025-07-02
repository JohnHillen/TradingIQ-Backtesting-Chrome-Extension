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
    let tfList = parseTfList(['tfList'], ['CURRENT_TF']);
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
