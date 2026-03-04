import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type CaptureResponse =
  | { success: true; html: string }
  | { success: false; error: string }

type ScrollResponse =
  | { success: true; message?: string }
  | { success: false; error: string }

const mockData = {
  html: `<!DOCTYPE html>
<html>
<head><title>ChatGPT Mock Page</title></head>
<body>
  <div data-message-author-role="user">
    <div class="whitespace-pre-wrap">How do I create a Chrome extension with Vue 3?</div>
  </div>
  <div data-message-author-role="assistant">
    <div class="whitespace-pre-wrap">To create a Chrome extension with Vue 3, you'll need...</div>
  </div>
  <div data-message-author-role="user">
    <div class="whitespace-pre-wrap">Can you show me how to implement automatic DOM capture?</div>
  </div>
  <div data-message-author-role="user">
    <div class="whitespace-pre-wrap">What are the best practices for Chrome extension development?</div>
  </div>
  <div data-message-author-role="user">
    <div class="whitespace-pre-wrap">How can I make my extension work with Manifest V3?</div>
  </div>
</body>
</html>`,
  matches: [
    "How do I create a Chrome extension with Vue 3?",
    "Can you show me how to implement automatic DOM capture?",
    "What are the best practices for Chrome extension development?",
    "How can I make my extension work with Manifest V3?",
    "How do I set up content scripts in a Chrome extension?",
    "What permissions do I need for reading DOM content?",
    "How can I debounce DOM scanning for better performance?",
    "Is it possible to capture Shadow DOM content?",
    "How do I handle multiple tabs in an extension?",
    "What is the best way to store user preferences?",
    "How do I add keyboard shortcuts to an extension?",
    "How can I style a popup with Tailwind CSS?",
    "How do I communicate between popup and background scripts?",
    "What are common pitfalls when migrating to Manifest V3?",
    "How can I reduce bundle size for a Chrome extension?",
    "How do I debug content scripts effectively?",
  ],
}

function decodeHtmlEntities(text: string) {
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  return textarea.value
}

function extractMatches(htmlContent: string) {
  const regex = /data-message-author-role="user".*?<div class="whitespace-pre-wrap">(.*?)<\/div>/gs
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(htmlContent)) !== null) {
    const decodedText = decodeHtmlEntities(match[1])
    matches.push(decodedText)
  }

  return matches
}

export default function App() {
  const isExtensionMode = useMemo(
    () => typeof chrome !== "undefined" && !!chrome.runtime?.id,
    []
  )
  const [domHtml, setDomHtml] = useState("")
  const [extractedMatches, setExtractedMatches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isScrolling, setIsScrolling] = useState(false)

  const matchCount = extractedMatches.length

  const captureDOM = async () => {
    setIsLoading(true)
    setError("")
    setDomHtml("")
    setExtractedMatches([])

    try {
      if (isExtensionMode) {
        const response = await new Promise<CaptureResponse>((resolve) => {
          chrome.runtime.sendMessage({ action: "getDOMFromActiveTab" }, resolve)
        })

        if (response.success) {
          setDomHtml(response.html)
          const matches = extractMatches(response.html)
          setExtractedMatches(matches)
        } else {
          const errorMsg = response.error || "Failed to capture DOM"
          if (errorMsg.includes("restricted pages")) {
            setError(
              "Cannot capture DOM from this page. Please navigate to a regular website (not chrome://, extension pages, etc.) and reopen the extension."
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
        // Dev mode: domHtml is just used to show the list UI;
        // matches are intentionally hardcoded and not parsed from mockData.html.
        setDomHtml(mockData.html)
        setExtractedMatches(mockData.matches)
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

  const scrollToElement = async (text: string) => {
    if (!isExtensionMode) {
      alert(`Would scroll to: "${text}"`)
      return
    }

    setIsScrolling(true)
    setError("")

    try {
      const response = await new Promise<ScrollResponse>((resolve) => {
        chrome.runtime.sendMessage({ action: "scrollToElement", text }, resolve)
      })

      if (response.success) {
        window.close()
      } else {
        setError(response.error || "Failed to scroll to element")
        setIsScrolling(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(`Scroll error: ${message}`)
      setIsScrolling(false)
    }
  }

  useEffect(() => {
    captureDOM()
  }, [])

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="space-y-3">
        <div className="space-y-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold leading-none tracking-tight">User Messages</h1>
            <Badge variant="secondary">{matchCount} found</Badge>
          </div>
          <p className="text-sm text-muted-foreground sr-only">
            Auto-capture runs when the popup opens.
          </p>
        </div>
        <div className="space-y-3 px-3 pb-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Capturing DOM...
            </div>
          )}

          {!isLoading && !domHtml && !error && (
            <div className="text-sm text-muted-foreground">Ready to capture</div>
          )}

          {error && (
            <Alert>
              <AlertTitle>Capture failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {domHtml && (
            <div className="max-h-[calc(600px-100px)] overflow-y-auto bg-background">
              <div className="space-y-2 p-2">
                {matchCount > 0 ? (
                  extractedMatches.map((match, index) => (
                    <button
                      key={`${match}-${index}`}
                      type="button"
                      onClick={() => scrollToElement(match)}
                      className={cn(
                        "w-full rounded-lg border border-border bg-muted/40 px-3 py-3 text-left text-sm transition hover:bg-muted/80",
                        isScrolling && "pointer-events-none opacity-60"
                      )}
                    >
                      {index + 1}. {match}
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                    No matches found for the specified pattern.
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
