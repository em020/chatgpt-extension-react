// Keep this as a closed union of supported providers so new integrations are added explicitly.
export type ProviderId = "chatgpt" | "gemini"

export type ConversationMessage = {
  content: string
}

export type ProviderSummary = {
  id: ProviderId
  label: string
}

export type CaptureConversationResponse =
  | {
      success: true
      provider: ProviderSummary
      messages: ConversationMessage[]
    }
  | {
      success: false
      error: string
    }

export type ScrollToMessageResponse =
  | { success: true; message?: string }
  | { success: false; error: string }

export type ProviderAdapter = {
  id: ProviderId
  label: string
  matchesUrl: (url: string) => boolean
  extractMessages: (document: Document) => ConversationMessage[]
  findMessageElement: (document: Document, messageContent: string) => Element | null
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function findTextMatchInDocument(document: Document, messageContent: string) {
  const expectedText = normalizeText(messageContent)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node: Node | null

  while ((node = walker.nextNode())) {
    if (normalizeText(node.textContent || "") === expectedText) {
      return node.parentElement
    }
  }

  return null
}

const chatGptAdapter: ProviderAdapter = {
  id: "chatgpt",
  label: "ChatGPT",
  matchesUrl: (url) => {
    try {
      const hostname = new URL(url).hostname
      return hostname === "chatgpt.com" || hostname === "chat.openai.com"
    } catch {
      return false
    }
  },
  extractMessages: (document) => {
    const elements = document.querySelectorAll(
      '[data-message-author-role="user"] .whitespace-pre-wrap'
    )

    return Array.from(elements)
      .map((element) => normalizeText(element.textContent || ""))
      .filter(Boolean)
      .map((content) => ({ content }))
  },
  findMessageElement: (document, messageContent) => {
    const expectedText = normalizeText(messageContent)
    const elements = document.querySelectorAll(
      '[data-message-author-role="user"] .whitespace-pre-wrap'
    )

    for (const element of elements) {
      if (normalizeText(element.textContent || "") === expectedText) {
        return element
      }
    }

    return findTextMatchInDocument(document, messageContent)
  },
}

function getGeminiMessageContent(element: Element) {
  const lineElements = element.querySelectorAll(".query-text-line")
  const lines = Array.from(lineElements)
    .map((lineElement) => normalizeText(lineElement.textContent || ""))
    .filter(Boolean)

  if (lines.length > 0) {
    return normalizeText(lines.join("\n"))
  }

  return normalizeText(element.textContent || "")
}

const geminiAdapter: ProviderAdapter = {
  id: "gemini",
  label: "Gemini",
  matchesUrl: (url) => {
    try {
      const hostname = new URL(url).hostname
      return hostname === "gemini.google.com"
    } catch {
      return false
    }
  },
  extractMessages: (document) => {
    const elements = document.querySelectorAll("user-query .query-text")

    return Array.from(elements)
      .map((element) => getGeminiMessageContent(element))
      .filter(Boolean)
      .map((content) => ({ content }))
  },
  findMessageElement: (document, messageContent) => {
    const expectedText = normalizeText(messageContent)
    const elements = document.querySelectorAll("user-query .query-text")

    for (const element of elements) {
      if (getGeminiMessageContent(element) === expectedText) {
        return element
      }
    }

    return findTextMatchInDocument(document, messageContent)
  },
}

const providerAdapters: ProviderAdapter[] = [chatGptAdapter, geminiAdapter]

export function resolveProviderByUrl(url: string) {
  return providerAdapters.find((provider) => provider.matchesUrl(url)) || null
}
