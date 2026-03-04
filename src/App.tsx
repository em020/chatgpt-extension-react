import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  type CaptureConversationResponse,
  type ConversationMessage,
  type ProviderSummary,
  type ScrollToMessageResponse,
} from "@/lib/providers"

const mockData = {
  provider: {
    id: "chatgpt",
    label: "ChatGPT",
  } as ProviderSummary,
  messages: [
    { content: "How do I create a Chrome extension with React?" },
    { content: "Can you show me how to implement automatic conversation capture?" },
    { content: "What are the best practices for Chrome extension development?" },
    { content: "How can I make my extension work with Manifest V3?" },
    { content: "How do I set up content scripts in a Chrome extension?" },
    { content: "What permissions do I need for reading conversation content?" },
    { content: "How can I debounce DOM scanning for better performance?" },
    { content: "Is it possible to capture Shadow DOM content?" },
    { content: "How do I handle multiple tabs in an extension?" },
    { content: "What is the best way to store user preferences?" },
    { content: "How do I add keyboard shortcuts to an extension?" },
    { content: "How can I style a popup with Tailwind CSS?" },
    { content: "How do I communicate between popup and background scripts?" },
    { content: "What are common pitfalls when migrating to Manifest V3?" },
    { content: "How can I reduce bundle size for a Chrome extension?" },
    { content: "How do I debug content scripts effectively?" },
  ],
}

export default function App() {
  const isExtensionMode = useMemo(
    () => typeof chrome !== "undefined" && !!chrome.runtime?.id,
    []
  )
  const [provider, setProvider] = useState<ProviderSummary | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isScrolling, setIsScrolling] = useState(false)

  const matchCount = messages.length

  const captureConversation = async () => {
    setIsLoading(true)
    setError("")
    setProvider(null)
    setMessages([])

    try {
      if (isExtensionMode) {
        const response = await new Promise<CaptureConversationResponse>((resolve) => {
          chrome.runtime.sendMessage({ action: "captureConversationFromActiveTab" }, resolve)
        })

        if (response.success) {
          setProvider(response.provider)
          setMessages(response.messages)
        } else {
          const errorMsg = response.error || "Failed to capture conversation"
          if (errorMsg.includes("Cannot access this page")) {
            setError(
              "Cannot access this page. Please navigate to a regular website and reopen the extension."
            )
          } else if (errorMsg.includes("No active tab")) {
            setError(
              "No active tab found. Please ensure you have a web page open and try again."
            )
          } else {
            setError(errorMsg)
          }
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setProvider(mockData.provider)
        setMessages(mockData.messages)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      if (isExtensionMode) {
        setError(
          `Extension error: ${message}. Please try refreshing the page and reopening the extension.`
        )
      } else {
        setError(`Development mode error: ${message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToMessage = async (messageContent: string) => {
    if (!isExtensionMode) {
      alert(`Would scroll to: "${messageContent}"`)
      return
    }

    setIsScrolling(true)
    setError("")

    try {
      const response = await new Promise<ScrollToMessageResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { action: "scrollToMessageOnActiveTab", messageContent },
          resolve
        )
      })

      if (response.success) {
        window.close()
      } else {
        setError(response.error || "Failed to scroll to message")
        setIsScrolling(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(`Scroll error: ${message}`)
      setIsScrolling(false)
    }
  }

  useEffect(() => {
    captureConversation()
  }, [])

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="space-y-3">
        <div className="space-y-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold leading-none tracking-tight">
              User Messages
            </h1>
            <Badge variant="secondary">{matchCount} found</Badge>
          </div>
          <p className="text-sm text-muted-foreground sr-only">
            Auto-capture runs when the popup opens.
          </p>
          {provider && (
            <p className="text-xs text-muted-foreground">Source: {provider.label}</p>
          )}
        </div>
        <div className="space-y-3 px-3 pb-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Capturing conversation...
            </div>
          )}

          {!isLoading && matchCount === 0 && !error && (
            <div className="text-sm text-muted-foreground">Ready to capture</div>
          )}

          {error && (
            <Alert>
              <AlertTitle>Capture failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(matchCount > 0 || provider) && (
            <div className="max-h-[calc(600px-124px)] overflow-y-auto bg-background">
              <div className="space-y-2 p-2">
                {matchCount > 0 ? (
                  messages.map((message, index) => (
                    <button
                      key={`${message.content}-${index}`}
                      type="button"
                      onClick={() => scrollToMessage(message.content)}
                      className={cn(
                        "w-full rounded-lg border border-border bg-muted/40 px-3 py-3 text-left text-sm transition hover:bg-muted/80",
                        isScrolling && "pointer-events-none opacity-60"
                      )}
                    >
                      {index + 1}. {message.content}
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                    No user messages found for this provider.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-1 text-xs text-muted-foreground">Built with ❤️</div>
        </div>
      </div>
    </div>
  )
}
