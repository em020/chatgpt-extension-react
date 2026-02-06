import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 p-3 text-white">
      <Card className="border-white/20 bg-white/10 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white">User Messages</CardTitle>
            <Badge className="bg-yellow-300 text-black">{matchCount} found</Badge>
          </div>
          <p className="text-sm text-white/80">
            Auto-capture runs when the popup opens.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Capturing DOM...
            </div>
          )}

          {!isLoading && !domHtml && !error && (
            <div className="text-sm text-yellow-200">Ready to capture</div>
          )}

          {error && (
            <Alert className="text-white">
              <AlertTitle>Capture failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {domHtml && (
            <ScrollArea className="h-64 rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="space-y-2 pr-2">
                {matchCount > 0 ? (
                  extractedMatches.map((match, index) => (
                    <button
                      key={`${match}-${index}`}
                      type="button"
                      onClick={() => scrollToElement(match)}
                      className={cn(
                        "w-full rounded-md bg-white/10 px-3 py-2 text-left text-sm text-white transition hover:bg-white/20",
                        isScrolling && "pointer-events-none opacity-60"
                      )}
                    >
                      {index + 1}. {match}
                    </button>
                  ))
                ) : (
                  <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                    No matches found for the specified pattern.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="pt-1 text-xs text-white/70">Built with ❤️</div>
        </CardContent>
      </Card>
    </div>
  )
}
