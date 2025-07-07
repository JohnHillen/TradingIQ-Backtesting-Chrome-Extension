/*
 @license Copyright 2021 akumidv (https://github.com/akumidv/)
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';


const TF_UNIT_LIST = ['s', 'm', 'h', 'D', 'W', 'M', 'r']
let currentIqId = 'impulsIq'

const TIMEFRAME_INPUT = `Comma seperated
Timeframes or ranges.
e.g.<br>
single: 1m,1h,1D,1W,1M,...<br>
ranges: 1h-5h,30m-35m:5,...<br><br>
Step size is 1 or can be specified by a ':', eg: (1-11:2) This will be converted to 1,3,5,...,10,11.<br>`

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

const LINK_INFO = `If enabled the Min ATR will set as pairs, this will reduce the backtest cycles, eg.:<br>
Min ATR Profit: 0.2,0.5<br>
Min ATR Stop: 1,2<br>
enabled: (Profit: 0.2, Stop: 1), (Profit: 0.5, Stop: 2) = <b>2 cycle</b><br>
disabled: (Profit: 0.2, Stop: 1), (Profit: 0.2, Stop: 2), (Profit: 0.5, Stop: 1), (Profit: 0.5, Stop: 2) = <b>4 cycles</b>`

const LINK_LTF_HTF_INFO = `If enabled the LTF/HTF will set as
pairs, this will reduce the backtest cycles, eg.:<br>
LTF: 1m,5m<br>
HTF: 10m,20m<br>
enabled: (LTF: 1m, HTF: 10m), (LTF: 5m, HTF: 20m) = <b>2 cycles</b><br>
disabled: (LTF: 1m, HTF: 10m), (LTF: 1m, HTF: 20m), (LTF: 5m, HTF: 10m), (LTF: 5m, HTF: 20m) = <b>4 cycles</b>`

document.addEventListener('DOMContentLoaded', () => {
  // Use Promise.all to wait for all HTML loads
  Promise.all([
    loadHTML('impulsIq-container', 'impulsIq.html'),
    loadHTML('reversalIq-container', 'reversalIq.html'),
    loadHTML('counterIq-container', 'counterIq.html'),
    loadHTML('novaIq-container', 'novaIq.html'),
    loadHTML('razorIq-container', 'razorIq.html'),
    loadHTML('wickSlicerIq-container', 'wickSlicerIq.html'),
    loadHTML('backtest-settings-container', 'backtest_settings.html')
  ]).then(() => {
    attachDynamicEventListeners();
    checkIsTVChart();
    loadSettings();
  });

  fetch("../../manifest.json")
    .then(response => response.json())
    .then(json => document.getElementById('version').innerText = 'Version ' + json.version);

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

function loadHTML(id, url) {
  return fetch(url)
    .then(response => response.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
    });
}

