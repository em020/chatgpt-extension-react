/// <reference types="chrome" />

import {
  type CaptureConversationResponse,
  type ProviderSummary,
  type ScrollToMessageResponse,
  resolveProviderByUrl,
} from "@/lib/providers"

function captureConversation(): CaptureConversationResponse {
  try {
    const provider = resolveProviderByUrl(window.location.href)

    if (!provider) {
      return {
        success: false,
        error: "This page is not supported yet. Open ChatGPT and try again.",
      }
    }

    return {
      success: true,
      provider: {
        id: provider.id,
        label: provider.label,
      } satisfies ProviderSummary,
      messages: provider.extractMessages(document),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: message }
  }
}

function scrollToMessage(messageContent: string): ScrollToMessageResponse {
  try {
    const provider = resolveProviderByUrl(window.location.href)

    if (!provider) {
      return {
        success: false,
        error: "This page is not supported yet. Open ChatGPT and try again.",
      }
    }

    const element = provider.findMessageElement(document, messageContent)

    if (!element) {
      return { success: false, error: "Message not found on the page" }
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })

    return { success: true, message: "Successfully scrolled to message" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: `Scroll failed: ${message}` }
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void _sender

  if (request.action === "captureConversation") {
    sendResponse(captureConversation())
  }

  if (request.action === "scrollToMessage") {
    sendResponse(scrollToMessage(request.messageContent))
  }

  return true
})
