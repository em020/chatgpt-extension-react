/// <reference types="chrome" />

function captureDOM() {
  return document.documentElement.outerHTML
}

function findElementByText(text: string) {
  const chatGPTElements = document.querySelectorAll(
    '[data-message-author-role="user"] .whitespace-pre-wrap'
  )
  for (const element of chatGPTElements) {
    if (element.textContent?.trim() === text.trim()) {
      return element
    }
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes: Element[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    if (node.textContent?.trim() === text.trim()) {
      if (node.parentElement) {
        textNodes.push(node.parentElement)
      }
    }
  }

  return textNodes.length > 0 ? textNodes[0] : null
}

function scrollToElement(text: string) {
  try {
    const element = findElementByText(text)

    if (!element) {
      return { success: false, error: "Element not found on the page" }
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })

    return { success: true, message: "Successfully scrolled to element" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: `Scroll failed: ${message}` }
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void _sender

  if (request.action === "captureDOM") {
    try {
      const domHTML = captureDOM()
      sendResponse({ success: true, html: domHTML })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      sendResponse({ success: false, error: message })
    }
  }

  if (request.action === "scrollToElement") {
    try {
      const result = scrollToElement(request.text)
      sendResponse(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      sendResponse({ success: false, error: message })
    }
  }

  return true
})
