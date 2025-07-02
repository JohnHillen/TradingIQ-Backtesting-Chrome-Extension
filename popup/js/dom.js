

function showHint(parentNode, elementId, text, autoHide = true) {
  console.log('showHint')
  const hint = document.createElement('div');
  hint.id = elementId + '_hint';
  hint.className = 'hint';
  hint.style.color = 'red';
  hint.innerText = text;
  parentNode.appendChild(hint);

  if (autoHide) {
    setTimeout(() => {
      hint.remove();
    }, 6000);
  }
}

function getElementValueById(id) {
  let element = document.getElementById(id);
  if (!element) {
    return null
  }
  return element.type === 'checkbox' ? element.checked : element.value
}
