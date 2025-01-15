const page = {}

page.waitForTimeout = async (timeout = 2500) => new Promise(resolve => setTimeout(resolve, timeout))

page.waitForSelectorOld2del = async function (selector, timeout = 5000, isHide = false, parentEl) { //2023-04-18
  parentEl = parentEl ? parentEl : document
  return new Promise(async (resolve) => {
    let iter = 0
    let elem
    const tikTime = timeout === 0 ? 1000 : 50
    do {
      await page.waitForTimeout(tikTime)
      elem = parentEl.querySelector(selector)
      iter += 1
    } while ((timeout === 0 ? true : (tikTime * iter) < timeout) && (isHide ? !!elem : !elem))
    resolve(elem)
  });
}


page.waitForSelector = async (selector, timeout = 5000, isHide = false, parentEl = null) => {
  return new Promise(async (resolve) => {
    parentEl = parentEl ? parentEl : document
    let iter = 0
    let elem = parentEl.querySelector(selector)
    const tikTime = timeout === 0 ? 1000 : 50
    while (timeout === 0 || (!isHide && !elem) || (isHide && !!elem)) {
      await page.waitForTimeout(tikTime)
      elem = parentEl.querySelector(selector)
      iter += 1
      if (elem || (timeout !== 0 && tikTime * iter >= timeout))
        break
    }
    return resolve(elem ? elem : null)
  })
}

const reactValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
page._inputEvent = new Event('input', { bubbles: true });
page._changeEvent = new Event('change', { bubbles: true });

page._mouseEvents = {};
["mouseover", "mousedown", "mouseup", "click",
  "dblclick", "contextmenu"].forEach(eventType => {
    page._mouseEvents[eventType] = document.createEvent('MouseEvents')
    page._mouseEvents[eventType].initEvent(eventType, true, true)
  })

page.getTextForSel = function (selector, elParent) {
  elParent = elParent ? elParent : document
  const element = elParent.querySelector(selector)
  return element ? element.innerText : null
}

page.setInputElementValue = function (element, value, isChange = false) {
  reactValueSetter.call(element, value)
  element.dispatchEvent(page._inputEvent);
  if (isChange) element.dispatchEvent(page._changeEvent);
}

page.typeIntoInput = async function (input, text) {
  let l = text.length
  let current = 0
  input.focus()
  input.value = ''

  while (current < l - 1) {
    console.log('typeIntoInput:', text[current], 'timestamp:', new Date().getTime())
    input.value += text[current]
    current++
    input.dispatchEvent(page._changeEvent)
    await page.waitForTimeout(util.getRandomInt(45, 20))
  }
}

page.mouseClick = function (el) {
  ["mouseover", "mousedown", "mouseup", "click"].forEach((eventType) => {
    let event = new MouseEvent(eventType, {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });
    el.dispatchEvent(event)
  }
  )
}

page.mouseClickSelector = function (selector) {
  const el = document.querySelector(selector)
  if (el)
    page.mouseClick(el)
}

page.$ = function (selector) {
  return document.querySelector(selector)
}

page.getElText = (element) => {
  return element.innerText.replaceAll('​', '')
}

page.setSelByText = (selector, textValue) => {
  let isSet = false
  const selectorAllVal = document.querySelectorAll(selector)
  if (!selectorAllVal || !selectorAllVal.length)
    return isSet
  for (let optionsEl of selectorAllVal) {
    if (optionsEl) {//&& options.innerText.startsWith(textValue)) {
      const itemValue = page.getElText(optionsEl).toLowerCase()
      if (itemValue && textValue && itemValue.startsWith(textValue.toLowerCase())) {
        page.mouseClick(optionsEl)
        isSet = true
        break
      }
    }
  }
  return isSet
}

