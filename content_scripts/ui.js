const ui = {
  isMsgShown: false
}
/*
const scriptFonts = document.createElement('style')
scriptFonts.innerHTML = '@font-face {' +
  '    font-family: "Font Awesome 5 Free";' +
  '    font-style: normal;\n' +
  '    font-weight: 900;' +
  '    font-display: block;' +
  `    src: url(${chrome.runtime.getURL('fonts/fa-solid-900.woff2')}) format('woff2');` +
  '}\n' +
  '.iondv_icon::before {\n' +
  '    display: inline-block;\n' +
  '    font-style: normal;\n' +
  '    font-variant: normal;\n' +
  '    text-rendering: auto;\n' +
  '    -webkit-font-smoothing: antialiased;\n' +
  '  }\n' +
  '.iondv_download::before {\n' +
  '    font-family: "Font Awesome 5 Free"; font-weight: 900; font-size: 1.25em; content: "\\f56d";\n' +
  '  }\n' +
  '.iondv_upload::before {\n' +
  '    font-family: "Font Awesome 5 Free"; font-weight: 900; font-size: 1.25em; content: "\\f574";\n' +
  '  }\n' +
  '.iondv_copy::before {\n' +
  '    font-family: "Font Awesome 5 Free"; font-weight: 900; font-size: 1.25em; content: "\\f0c5";\n' +
  '  }\n'
document.documentElement.appendChild(scriptFonts)
*/
ui.tiqStylePopup = `<style>
  .tiqPopup {
    display: table;
    position: relative;
    margin: 40px auto 0;
    width: 500px;
    background-color: #131722;
    color: #00ffff;
    transition: all 0.2s ease;
  }
</style>`

ui.styleValWindowShadow = `background-color:rgba(0, 0, 0, 0.4);
position:absolute;
width:100%;
height:100%;
top:0px;
left:0px;
z-index:10000;`

ui.alertPopup = async (msgText) => {
  return new Promise(resolve => {
    function removeAlertPopup() {
      const tiqAlertPopupEl = document.getElementById('tiqAlertPopup')
      if (tiqAlertPopupEl)
        tiqAlertPopupEl.parentNode.removeChild(tiqAlertPopupEl)
      return resolve(true)
    }

    if (document.getElementById('tiqAlertPopup'))
      return resolve()

    const mObj = document.getElementsByTagName('body')[0].appendChild(document.createElement('div'))
    mObj.id = 'tiqAlertPopup'
    mObj.setAttribute('style', ui.styleValWindowShadow)
    mObj.style.height = document.documentElement.scrollHeight + 'px'
    mObj.innerHTML = ui.tiqStylePopup + `
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<div class="tiqPopup w3-panel w3-card w3-padding-16">
  <span id="tiqPopupCloseBtn" class="w3-button w3-large w3-display-topright">&times;</span>
  <h3 class="w3-center">Trading IQ Extension</h3>
  <p>${msgText}</p>
</div>`
    const btnOk = document.getElementById('tiqPopupCloseBtn')
    if (btnOk) {
      btnOk.focus()
      btnOk.onclick = removeAlertPopup
    }
  })
}

ui.showPopup = async (msgText) => {
  return await ui.alertPopup(msgText)
}

ui.statusMessageRemove = () => {
  const statusMessageEl = document.getElementById('tiqStatus')
  if (statusMessageEl)
    statusMessageEl.parentNode.removeChild(statusMessageEl)
}

ui.autoCloseAlert = (msg, duration = 3000) => {
  const altEl = document.createElement('div')
  altEl.setAttribute('style', 'color: #131722;background-color: #00ffff; width: 350px;height: 200px;position: absolute;top:0;bottom:0;left:0;right:0;margin:auto;border: 1px solid black;font-family:arial;font-size:15px;font-weight:bold;display: flex; align-items: center; justify-content: center; text-align: center;')
  altEl.setAttribute('id', 'tiqAlertAutoClose')
  altEl.innerHTML = msg
  setTimeout(function () {
    altEl.parentNode.removeChild(altEl)
  }, duration)
  document.body.appendChild(altEl)
}

ui.styleValStausMessage = `
.button {
    background-color: white;
    border: none;
    color: white;
    padding: 10px 2px;
    text-align: center;
    text-decoration: none;
    font-size: 14px;
    margin-top:-10px;
    margin-right:-0px;
    -webkit-transition-duration: 0.4s; /* Safari */
    transition-duration: 0.4s;
    cursor: pointer;
    width: 50px;
    float: right;
    border-radius: 3px;
    display: inline-block;
    line-height: 0;
}
.button-close:hover {
    background-color: gray;
    color: white;
}
.button-close {
    background-color: white;
    color: black;
    border: 2px solid gray;
}`

ui.statusMessage = (msgText, processInfo = '', extraHeader = null) => {
  const isStatusPresent = document.getElementById('tiqStatus')
  const mObj = isStatusPresent ? document.getElementById('tiqStatus') : document.createElement('div')
  let msgEl
  if (!isStatusPresent) {
    mObj.id = 'tiqStatus'
    mObj.setAttribute('style', ui.styleValWindowShadow)
    mObj.style.height = document.documentElement.scrollHeight + 'px'
    //const msgStyleEl = mObj.appendChild(document.createElement('style'))
    //msgStyleEl.innerHTML = ui.styleValStausMessage
    msgEl = mObj.appendChild(document.createElement('div'))
    msgEl.id = 'tiqStatusMsg'
  } else {
    msgEl = document.getElementById('tiqStatusMsg')
  }
  if (isStatusPresent && msgEl && document.getElementById('tiqBoxMsg') && !extraHeader) {
    document.getElementById('tiqBoxMsg').innerHTML = msgText
    document.getElementById('tiqProcessInfo').innerHTML = processInfo
  } else {
    extraHeader = extraHeader !== null ? `<div style="font-size: 12px;margin-left: 5px;margin-right: 5px;text-align: left;">${extraHeader}</div>` : '' //;margin-bottom: 10px
    msgEl.innerHTML = ui.tiqStylePopup + `
      <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
      <div class="tiqPopup w3-panel w3-card w3-padding-16">
        <h3 class="w3-center">Trading IQ Extension</h3>
        ${extraHeader}
        <div class="w3-padding">
          <p id="tiqBoxMsg">${msgText}</p>
        </div>
        <div class="w3-padding w3-center">
          <p id="tiqProcessInfo">${processInfo}</p>
        </div>
        <div class="w3-padding">
            <button id="tiqBoxClose" class="w3-btn w3-block w3-round w3-aqua">Stop</button>
        </div>
      </div>`
  }
  if (!isStatusPresent) {
    const tvDialog = document.getElementById('overlap-manager-root')
    if (tvDialog)
      document.body.insertBefore(mObj, tvDialog) // For avoid problem if msg overlap tv dialog window
    else
      document.body.appendChild(mObj)
  }
  const btnClose = document.getElementById('tiqBoxClose')
  if (btnClose) {
    btnClose.onclick = () => {
      console.log('Stop clicked')
      btnClose.textContent = 'Stopping...'
      btnClose.disabled = true
      action.workerStatus = null
    }
  }
}