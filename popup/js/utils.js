// Utility functions for popup

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
  console.log('utils.parseRange', val);
  let parts = val.split(',').filter(part => part.trim() !== '');
  let result = [];

  try {
    parts.forEach(part => {
      if (!/\d$/.test(part)) {
        part = part.slice(0, -1);
      }
      if (part.includes('-')) {
        if (/^-/.test(part)) {
          result.error = `Invalid value "${part}", must be start with a number`;
          return result;
        }

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
          result.error = `Invalid value "${part}".
          If the range starts with 0, you must define a step size: ":<step>", eg: "0-5:2".`;
          return result
        }
      }
      else if (part.includes(':')) {
        result.error = `Invalid value "${part}".
          Step size must be defined at the end of a range, eg: "0-5:2" or "1-5:0.5".`;
        return result
      }
      else {
        let decimalPlaces = (part.split('.')[1] || '').length;
        result.push(parseFloat(part).toFixed(decimalPlaces));
      }
    });
  } catch (ignore) {
    console.error(ignore);
  }

  return result.error === undefined ? [...new Set(result)].join(',') : result;
}

function parseValue(value) {
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return value.toLowerCase() === 'true';
  } else if (value.toLowerCase() === 'on' || value.toLowerCase() === 'off') {
    return value.toLowerCase() === 'on';
  }
  return value;
}

function disable(elId) {
  try {
    document.getElementById(elId).classList.toggle('disabled')
  } catch (e) {
  }
}

function getLinkValue(elId1, elId2, defaultEmptyValue, isTFTypeEl = false) {
  let element1 = document.getElementById(elId1);
  let element2 = document.getElementById(elId2);
  let valList1;
  let valList2;
  if (isTFTypeEl) {
    valList1 = util.parseTfList(element1.value);
    valList2 = util.parseTfList(element2.value);
  } else {
    valList1 = parseRange(element1.value);
    valList2 = parseRange(element2.value);
    if (!valList1.error) {
      valList1 = verifyMinValue(element1, valList1);
    }
    if (!valList2.error) {
      valList2 = verifyMinValue(element2, valList2);
    }
  }

  if (valList1.error || valList2.error) {
    if (valList1.error) {
      valList1.errorElId = elId1;
      return valList1;
    }
    valList2.errorElId = elId2;
    return valList2;
  }

  if (isTFTypeEl) {
    valList1 = valList1.data ? valList1.data : [];
    valList2 = valList2.data ? valList2.data : [];
  } else {
    valList1 = valList1.split(',').map(v => v.trim());
    valList2 = valList2.split(',').map(v => v.trim());
  }

  let curVal1, curVal2;
  let linkList = [];
  for (let i = 0; i < Math.max(valList1.length, valList2.length); i++) {
    curVal1 = i < valList1.length ? valList1[i] : valList1[valList1.length - 1];
    curVal2 = i < valList2.length ? valList2[i] : valList2[valList2.length - 1];
    curVal1 = curVal1 === '' ? defaultEmptyValue : curVal1;
    curVal2 = curVal2 === '' ? defaultEmptyValue : curVal2;
    linkList.push(`${curVal1}:${curVal2}`);
  }
  return { value: linkList.join(','), error: null };
}

function verifyMinValue(element, valList) {
  let dataMin = element.hasAttribute('data-min') ? parseFloat(element.getAttribute('data-min')) : null;
  let error = null;
  if (dataMin !== null) {
    let minValue = element.value.includes(',') ? Math.min(...valList.split(',')) : parseFloat(element.value);
    error = dataMin > minValue ? `'${constants[element.id]}': Minimum value is ${dataMin}` : null;
  }

  return error === null ? valList : {error: error, data: valList};
}