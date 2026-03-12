"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Code2, Copy, Trash2, FileCode, Check, Sidebar as SidebarIcon } from "lucide-react"
import { Snippet } from "@/lib/types"
import { AddSnippetDialog } from "./AddSnippetDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function SnippetVault() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { toast } = useToast()

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("html_snippet_vault")
    if (saved) {
      try {
        setSnippets(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved snippets")
      }
    }
  }, [])

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("html_snippet_vault", JSON.stringify(snippets))
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt)
  }, [snippets, searchQuery])

  const selectedSnippet = useMemo(() => {
    return snippets.find(s => s.id === selectedId) || null
  }, [snippets, selectedId])

  const handleAddSnippet = (newSnippet: Snippet) => {
    setSnippets(prev => [newSnippet, ...prev])
    setSelectedId(newSnippet.id)
  }

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast({
      title: "Snippet deleted",
      variant: "default"
    })
  }

  const copyToClipboard = async () => {
    if (!selectedSnippet) return
    try {
      await navigator.clipboard.writeText(selectedSnippet.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: "Copied!",
        description: "Snippet copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-body">
      {/* Sidebar - Panel 1 (Navigation & Actions) */}
      <aside 
        className={cn(
          "bg-white border-r flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 px-1">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
              <FileCode className="h-5 w-5" />
            </div>
            {isSidebarOpen && <span className="font-headline font-bold text-primary tracking-tight">SnippetVault</span>}
          </div>

          <div className="flex-1 space-y-2">
            <AddSnippetDialog onAdd={handleAddSnippet} />
          </div>

          <div className="mt-auto space-y-4">
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              {isSidebarOpen && <span>{snippets.length} snippets stored</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main List - Panel 2 (Search & List) */}
      <main className="flex-1 flex flex-col bg-[#F8FAFB] border-r max-w-md min-w-[320px]">
        <header className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search snippets..." 
              className="pl-9 bg-secondary/20 border-none focus-visible:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredSnippets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Code2 className="h-12 w-12 text-muted/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No snippets found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or add a new one.</p>
              </div>
            ) : (
              filteredSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedId(snippet.id)}
                  className={cn(
                    "group relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent",
                    selectedId === snippet.id ? "bg-white border-accent shadow-sm" : "hover:border-secondary"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={cn(
                      "text-sm font-semibold truncate flex-1",
                      selectedId === snippet.id ? "text-primary" : "text-foreground"
                    )}>
                      {snippet.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                      onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-code bg-secondary/10 px-1 rounded">
                    {snippet.code.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Detail Panel - Panel 3 (Code Viewer) */}
      <section className="flex-[2] flex flex-col bg-white">
        {selectedSnippet ? (
          <>
            <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex flex-col">
                <h2 className="text-lg font-headline font-semibold text-primary">{selectedSnippet.title}</h2>
                <p className="text-xs text-muted-foreground">Added {new Date(selectedSnippet.createdAt).toLocaleDateString()}</p>
              </div>
              <Button 
                onClick={copyToClipboard}
                className={cn(
                  "gap-2 transition-all duration-300",
                  isCopied ? "bg-green-600 hover:bg-green-700" : "bg-accent hover:bg-accent/90"
                )}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied" : "Copy Code"}
              </Button>
            </header>
            <ScrollArea className="flex-1 bg-[#1e1e1e]">
              <div className="p-6">
                <pre className="font-code text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap break-all">
                  <code>{selectedSnippet.code}</code>
                </pre>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#F8FAFB]">
            <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <FileCode className="h-10 w-10 text-accent/40" />
            </div>
            <h2 className="text-xl font-headline font-bold text-primary mb-2">Select a Snippet</h2>
            <p className="text-muted-foreground max-w-sm">
              Choose a snippet from the list on the left to view and copy its HTML code.
            </p>
          </div>
        )}
      </section>

      {/* Sidebar Toggle for Mobile/Minimal View */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-primary text-white rounded-full shadow-lg md:hidden"
      >
        <SidebarIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
