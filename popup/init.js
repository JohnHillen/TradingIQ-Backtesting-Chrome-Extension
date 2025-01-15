/*
 @license Copyright 2021 akumidv (https://github.com/akumidv/)
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  checkIsTVChart()
  setPopupInputsByOptions()
});

const IMPULS = 'Impulse IQ Backtester [Trading IQ]'
const REVERSAL = 'Reversal IQ Backtester [Trading IQ]'
const COUNTER_STRIKE = 'Counter Strike Backtester [Trading IQ]'
const NOVA = 'Nova IQ Backtester [Trading IQ]'
const SUPPORTED_STRATEGIES = [IMPULS, REVERSAL, COUNTER_STRIKE, NOVA];
const TF_UNIT_LIST= ['s', 'm', 'h', 'D', 'W', 'M', 'r']

function checkIsTVChart() {
  console.log('checkIsTVChart')

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('tabs', tabs)
    try {
      let isTVTab = tabs[0].url.includes('tradingview.com')
      let isEnglish = tabs[0].url.includes('www.tradingview.com') || tabs[0].url.includes('https://tradingview.com')
      document.getElementById("unsupportedPage").style.display = (isTVTab && isEnglish) ? 'none' : 'block'
      document.getElementById("supportedPage").style.display = !(isTVTab && isEnglish) ? 'none' : 'block'

      if (isTVTab && isEnglish) {
        document.getElementById("testStrategy").addEventListener('click', function () { startTest() })
        document.getElementById("initIq").addEventListener('click', function () { initIq() })
        document.getElementById("testingTab").addEventListener('click', function () { openTab('Testing') })
        document.getElementById("initTab").addEventListener('click', function () { openTab('Initialize') })
        document.getElementById("settingTab").addEventListener('click', function () { openTab('Settings') })
      }
    } catch (e) {
      console.error(e)
    }
  });
}

function setPopupInputsByOptions() {
  chrome.storage.local.get('tiqTestOptions', (getResults) => {
    console.log('load tiqTestOptions, ', getResults)
    if (getResults.hasOwnProperty('tiqTestOptions')) {
      const tiqOptions = getResults['tiqTestOptions']
      console.log('tiqTestOptions', tiqOptions)

      if (document.getElementById('tfList') && tiqOptions.hasOwnProperty('tfList') && tiqOptions.tfList !== null) {
        document.getElementById('tfList').value = tiqOptions.tfList
      }
      if (document.getElementById('reportFormat') && tiqOptions.hasOwnProperty('reportFormat') && tiqOptions.reportFormat !== null) {
        document.getElementById('reportFormat').value = tiqOptions.reportFormat
      }
      if (document.getElementById('timeoutInput') && tiqOptions.hasOwnProperty('timeout') && tiqOptions.timeout !== null) {
        document.getElementById('timeoutInput').value = tiqOptions.timeout
      }
      if (document.getElementById('retryInput') && tiqOptions.hasOwnProperty('retry') && tiqOptions.retry !== null) {
        document.getElementById('retryInput').value = tiqOptions.retry
      }
    }
  });
  chrome.storage.local.get('tiqInitOptions', (getResults) => {
    console.log('load tiqInitOptions, ', getResults)
    if (getResults.hasOwnProperty('tiqInitOptions')) {
      const tiqOptions = getResults['tiqInitOptions']
      console.log('tiqInitOptions', tiqOptions)

      if (tiqOptions.hasOwnProperty('tf') && tiqOptions.tf !== null) {
        document.getElementById('tfInterval').value = tiqOptions.tf.slice(0, -1)
        document.getElementById('tfUnit').value = TF_UNIT_LIST.indexOf(tiqOptions.tf.slice(-1))
      }
      if (document.getElementById('iqIndicator') && tiqOptions.hasOwnProperty('iqIndicator') && tiqOptions.iqIndicator !== null) {
        document.getElementById('iqIndicator').value = SUPPORTED_STRATEGIES.indexOf(tiqOptions.iqIndicator)
      }
      if (document.getElementById('timeoutInput') && tiqOptions.hasOwnProperty('timeout') && tiqOptions.timeout !== null) {
        document.getElementById('timeoutInput').value = tiqOptions.timeout
      }
      if (document.getElementById('retryInput') && tiqOptions.hasOwnProperty('retry') && tiqOptions.retry !== null) {
        document.getElementById('retryInput').value = tiqOptions.retry
      }
    }
  });
}

function getTestOptions() {
  const options = {}
  options.tfList = document.getElementById('tfList').value
  options.timeout = document.getElementById('timeoutInput').value
  if (!options.timeout) {
    options.timeout = 60
  }
  options.retry = document.getElementById('retryInput').value
  if (!options.retry) {
    options.retry = 5
  }
  options.reportFormat = document.getElementById('reportFormat').value
  return options
}

function startTest() {
  console.log('startTest')

  let msgOptions = null
  msgOptions = getTestOptions()
  chrome.storage.local.set({ 'tiqTestOptions': msgOptions })

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = { action: 'testStrategy', options: msgOptions }
    chrome.tabs.sendMessage(tabs[0].id, message, function () {
      window.close()
    });
  });
}

function getInitOptions() {
  const options = {}
  let tfInterval = document.getElementById('tfInterval').value
  let tfUnit = TF_UNIT_LIST[document.getElementById('tfUnit').value]
  options.tf = tfInterval + tfUnit

  options.timeout = document.getElementById('timeoutInput').value
  if (!options.timeout) {
    options.timeout = 60
  }
  options.retry = document.getElementById('retryInput').value
  if (!options.retry) {
    options.retry = 5
  }
  options.iqIndicator = SUPPORTED_STRATEGIES[document.getElementById('iqIndicator').value]
  return options
}

function initIq() {
  console.log('initIq')

  let msgOptions = null
  msgOptions = getInitOptions()
  chrome.storage.local.set({ 'tiqInitOptions': msgOptions })

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = { action: 'initIq', options: msgOptions }
    chrome.tabs.sendMessage(tabs[0].id, message, function () {
      window.close()
    });
  });
}

function openTab(tabName) {
  var i, x, tablinks;
  x = document.getElementsByClassName("tabs");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < x.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" w3-border-aqua", "");
  }
  document.getElementById(tabName).style.display = "block";
  switch (tabName) {
    case 'Testing':
      document.getElementById('testingTab').className += " w3-border-aqua";
      break
    case 'Initialize':
      document.getElementById('initTab').className += " w3-border-aqua";
      break
    case 'Settings':
      document.getElementById('settingTab').className += " w3-border-aqua";
      break
  }
}

