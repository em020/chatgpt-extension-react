/// <reference types="chrome" />

function withActiveTab(
  sendResponse: (response: unknown) => void,
  callback: (activeTab: chrome.tabs.Tab) => void
) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab found" })
      return
    }

    const activeTab = tabs[0]
    const url = activeTab.url || ""

    if (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:")
    ) {
      sendResponse({
        success: false,
        error:
          "Cannot access this page. Please navigate to a regular website and try again.",
      })
      return
    }

    callback(activeTab)
  })
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void _sender

  if (request.action === "captureConversationFromActiveTab") {
    withActiveTab(sendResponse, async (activeTab) => {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id! },
          files: ["content-script.js"],
        })

        setTimeout(() => {
          chrome.tabs.sendMessage(
            activeTab.id!,
            { action: "captureConversation" },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error: `Failed to communicate with content script: ${chrome.runtime.lastError.message}`,
                })
              } else {
                sendResponse(response)
              }
            }
          )
        }, 100)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        sendResponse({
          success: false,
          error: `Failed to inject content script: ${message}`,
        })
      }
    })

    return true
  }

  if (request.action === "scrollToMessageOnActiveTab") {
    withActiveTab(sendResponse, async (activeTab) => {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id! },
          files: ["content-script.js"],
        })

        setTimeout(() => {
          chrome.tabs.sendMessage(
            activeTab.id!,
            {
              action: "scrollToMessage",
              messageContent: request.messageContent,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error: `Failed to communicate with content script: ${chrome.runtime.lastError.message}`,
                })
              } else {
                sendResponse(response)
              }
            }
          )
        }, 100)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        sendResponse({
          success: false,
          error: `Failed to inject content script: ${message}`,
        })
      }
    })

    return true
  }
})
