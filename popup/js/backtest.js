function calcNumberOfBacktests() {
  console.log('calcNumberOfBacktests');
  hideAllWarnings();
  let numberOfBacktests = 0;
  let iqParameters = getIqParameter();
  let countArr = [];

  for (let key in iqParameters) {
    if (iqParameters.hasOwnProperty(key)) {
      let elVal = iqParameters[key];
      let element = document.getElementById(key);
      console.log('calcNumberOfBacktests elVal', elVal)
      if (element?.type === 'text') {
        if (elVal.error === null) {
          if (element.dataset.type === 'tfList') {
            elVal = parseTfList([key]);
          } else {
            elVal = parseRange(elVal.value);
          }
        }
        if (elVal.error) {
          showWarning(elVal.error, key);
          return
        }
        else if (elVal.data) {
          elVal = elVal.data.toString();
        }
      }
      else {
        elVal = elVal.value;
      }
      let commaCount = elVal === true || elVal === false ? 1 : (elVal?.match(/,/g) || []).length + 1;
      if (elVal?.length > 0) {
        countArr.push(commaCount);
      }
    }
  }

  initFileName()
  let tfList = parseTfList(['tfList'], ['CURRENT_TF']);
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

function parseTfList(elementIds, defaultValue) {
  let tfList = '';
  for (let i = 0; i < elementIds.length; i++) {
    let element = document.getElementById(elementIds[i]);
    let val = element.value.trim();
    if (val.length === 0) {
      continue;
    }
    if (tfList.length > 0) {
      tfList += ',';
    }
    tfList += element.value;
  }
  tfList = util.normalize(tfList);
  tfList = util.parseTfList(tfList)
  console.log('parseTfList:', elementIds, tfList)
  if (tfList.error) {
    showWarning(tfList.error, elementIds[0]);
    return tfList
  }

  if (tfList.data.length === 0 && defaultValue) {
    tfList.data = defaultValue
  }
  return tfList
}
