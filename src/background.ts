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

function sendMessageToTab(
  tabId: number,
  message: unknown,
  sendResponse: (response: unknown) => void
) {
  chrome.tabs.sendMessage(tabId, message, async (response) => {
    if (!chrome.runtime.lastError) {
      sendResponse(response)
      return
    }

    const errorMessage = chrome.runtime.lastError.message || ""
    const needsInjection =
      errorMessage.includes("Receiving end does not exist") ||
      errorMessage.includes("Could not establish connection")

    if (!needsInjection) {
      sendResponse({
        success: false,
        error: `Failed to communicate with content script: ${errorMessage}`,
      })
      return
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-script.js"],
      })

      chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: `Failed to communicate with content script: ${chrome.runtime.lastError.message}`,
          })
        } else {
          sendResponse(retryResponse)
        }
      })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown error"
      sendResponse({
        success: false,
        error: `Failed to inject content script: ${messageText}`,
      })
    }
  })
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void _sender

  if (request.action === "captureConversationFromActiveTab") {
    withActiveTab(sendResponse, async (activeTab) => {
      sendMessageToTab(activeTab.id!, { action: "captureConversation" }, sendResponse)
    })

    return true
  }

  if (request.action === "scrollToMessageOnActiveTab") {
    withActiveTab(sendResponse, async (activeTab) => {
      sendMessageToTab(
        activeTab.id!,
        {
          action: "scrollToMessage",
          messageContent: request.messageContent,
        },
        sendResponse
      )
    })

    return true
  }
})
