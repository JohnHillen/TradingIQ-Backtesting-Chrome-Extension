/*
 @license Copyright 2021 akumidv (https://github.com/akumidv/)
 SPDX-License-Identifier: Apache-2.0
*/

'use strict';

(async function () {
  chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
      console.log('onMessage', request)
      if (sender.tab || !request.hasOwnProperty('action') || !request.action) {
        console.log('Not for action message received:', request)
        return sendResponse({ received: true })
      }
      if (action.workerStatus !== null) {
        const msg = `Test already started.<br>Please waiting for end previous work. Status: ${action.workerStatus}`
        console.log(msg)
        ui.autoCloseAlert(msg)
        return sendResponse({ received: true })
      }

      action.workerStatus = request.action
      console.log('handle: ', request)
      sendResponse({ received: true })
      try {
        switch (request.action) {
          case 'testStrategy':
            await action.testStrategy(request)
            break

          default:
            console.log('None of realisation for signal:', request)
        }
      } catch (err) {
        console.error(err)
        await ui.showPopup(`An error has occurred.\n\nReload the page and try again:\n${err.message}`)
      }
      action.workerStatus = null
      ui.statusMessageRemove()
    }
  );
})();
