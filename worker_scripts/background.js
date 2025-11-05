// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "performTrustedClick") {

    // Ziel-Tab ist der Tab, der die Nachricht gesendet hat
    const target = { tabId: sender.tab.id };
    const protocolVersion = "1.3";

    // 1. Debugger an den Tab anhängen
    chrome.debugger.attach(target, protocolVersion, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      // 2. 'mousePressed' senden
      chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: message.x,
        y: message.y,
        button: "left",
        clickCount: 1
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('MousePressed Error:', chrome.runtime.lastError.message);
          chrome.debugger.detach(target); // Bei Fehler trotzdem ablösen
          sendResponse({ success: false, error: 'MousePressed Error' });
          return;
        }

        // 3. 'mouseReleased' senden (das vollendet den Klick)
        chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
          type: "mouseReleased",
          x: message.x,
          y: message.y,
          button: "left",
          clickCount: 1
        }, () => {
          if (chrome.runtime.lastError) {
             console.error('MouseReleased Error:', chrome.runtime.lastError.message);
          }

          // 4. Debugger wieder ablösen
          chrome.debugger.detach(target, () => {
            console.log('Debugger click complete and detached.');
            sendResponse({ success: true });
          });
        });
      });
    });

    // WICHTIG: return true, um anzuzeigen, dass wir asynchron antworten
    return true;
  }
});