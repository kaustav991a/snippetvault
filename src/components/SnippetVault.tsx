"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Code2, Copy, Trash2, FileCode, Check, Loader2, Wand2, BookOpen, Sparkles, ChevronLeft, PanelLeftClose, PanelLeft, GripVertical, X } from "lucide-react"
import { Snippet } from "@/lib/types"
import { AddSnippetDialog } from "./AddSnippetDialog"
import { EditSnippetDialog } from "./EditSnippetDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, deleteDoc, doc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { explainSnippet } from "@/ai/flows/ai-explain-snippet"
import { refactorSnippet } from "@/ai/flows/ai-refactor-snippet"
import { useIsMobile } from "@/hooks/use-mobile"

export default function SnippetVault() {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDetailVisible, setIsDetailVisible] = useState(true)
  
  // Resizing Logic
  const [listWidth, setListWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)

  // AI States
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isRefactoring, setIsRefactoring] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [])

  // Firebase Query
  const snippetsCollectionRef = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "snippets")
  }, [db])

  const { data: snippetsData = [], loading: snippetsLoading } = useCollection<Snippet>(snippetsCollectionRef)

  const snippets = useMemo(() => {
    return [...snippetsData].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [snippetsData])

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => 
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [snippets, searchQuery])

  const selectedSnippet = useMemo(() => {
    return snippets.find(s => s.id === selectedId) || null
  }, [snippets, selectedId])

  useEffect(() => {
    setExplanation(null)
  }, [selectedId])

  // Resize Handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || isMobile) return
    
    const sidebarWidth = isSidebarOpen ? 256 : 0
    const newWidth = e.clientX - sidebarWidth
    
    const minListWidth = 250
    const maxListWidth = window.innerWidth - sidebarWidth - 350
    
    if (newWidth >= minListWidth && newWidth <= maxListWidth) {
      setListWidth(newWidth)
    }
  }, [isResizing, isSidebarOpen, isMobile])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize)
      window.addEventListener("mouseup", stopResizing)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resize, stopResizing])

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!db) return

    const docRef = doc(db, "snippets", id)
    deleteDoc(docRef)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        })
        errorEmitter.emit('permission-error', permissionError)
      })

    if (selectedId === id) setSelectedId(null)
    toast({ title: "Snippet deleted" })
  }

  const handleSnippetSelect = (id: string) => {
    setSelectedId(id)
    setIsDetailVisible(true)
  }

  const handleExplain = async () => {
    if (!selectedSnippet) return
    setIsExplaining(true)
    try {
      const result = await explainSnippet({ htmlCode: selectedSnippet.code })
      setExplanation(result.explanation)
    } catch (error) {
      toast({
        title: "AI Analysis failed",
        description: "Could not generate explanation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExplaining(false)
    }
  }

  const handleRefactor = async () => {
    if (!selectedSnippet) return
    setIsRefactoring(true)
    try {
      const result = await refactorSnippet({ htmlCode: selectedSnippet.code })
      await navigator.clipboard.writeText(result.refactoredCode)
      toast({
        title: "AI Refactor Complete",
        description: "Optimized code has been copied to your clipboard.",
      })
    } catch (error) {
      toast({ title: "AI Refactor failed", variant: "destructive" })
    } finally {
      setIsRefactoring(false)
    }
  }

  const copyToClipboard = async () => {
    if (!selectedSnippet) return
    try {
      await navigator.clipboard.writeText(selectedSnippet.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({ title: "Copied!", description: "Snippet copied to clipboard." })
    } catch (err) {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  if (!mounted) return null

  const showDetail = isDetailVisible && (!!selectedId || !isMobile)
  const showList = !showDetail || !isMobile

  return (
    <div className={cn(
      "flex h-screen w-full bg-background overflow-hidden font-body relative",
      isResizing && "cursor-col-resize select-none"
    )}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r flex flex-col transition-all duration-300 ease-in-out shrink-0 z-50 fixed md:relative h-full overflow-hidden",
          isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-0 md:translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col gap-6 h-full w-64">
          <div className="flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
                <FileCode className="h-5 w-5" />
              </div>
              <span className="font-headline font-bold text-primary tracking-tight text-xl text-nowrap">Vault</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-none">
            <AddSnippetDialog />
          </div>

          <div className="mt-auto space-y-4 shrink-0">
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{snippets.length} snippets stored</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main List Area (Resizable) */}
      <main 
        style={{ width: (isMobile || !showDetail) ? '100%' : `${listWidth}px` }}
        className={cn(
          "flex flex-col bg-[#F8FAFB] border-r min-w-0 shrink-0 h-full overflow-hidden relative z-10",
          !isResizing && "transition-all duration-300",
          (!showList && isMobile) && "hidden"
        )}
      >
        <header className="p-4 border-b bg-white shrink-0 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-secondary/20 border-none focus-visible:ring-accent w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {snippetsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSnippets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Code2 className="h-12 w-12 text-muted/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No snippets found</p>
              </div>
            ) : (
              filteredSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => handleSnippetSelect(snippet.id)}
                  className={cn(
                    "group relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent",
                    selectedId === snippet.id ? "bg-white border-accent shadow-sm" : "hover:border-secondary"
                  )}
                >
                  <div className="flex justify-between items-center gap-2 mb-1 min-w-0">
                    <div className="flex-1 overflow-x-auto scrollbar-none py-0.5 min-w-0">
                      <h3 className={cn(
                        "text-sm font-semibold whitespace-nowrap",
                        selectedId === snippet.id ? "text-primary" : "text-foreground"
                      )}>
                        {snippet.title || "Untitled Snippet"}
                      </h3>
                    </div>
                    <div className="flex gap-1 shrink-0 items-center">
                      <EditSnippetDialog snippet={snippet} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 md:opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                        onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-code bg-secondary/10 px-1 rounded truncate">
                    {snippet.code?.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Resize Handle */}
      {!isMobile && showDetail && (
        <div 
          onMouseDown={startResizing}
          className={cn(
            "w-2 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-20 flex items-center justify-center group relative shrink-0",
            isResizing && "bg-accent/50"
          )}
        >
          <div className="w-[1px] h-full bg-border" />
          <div className={cn(
            "absolute transition-all duration-200 bg-accent rounded-full p-1 shadow-md z-30",
            isResizing ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100 scale-100"
          )}>
            <GripVertical className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <section 
        className={cn(
          "flex-1 flex flex-col bg-white overflow-hidden h-full min-w-0",
          !isResizing && "transition-all duration-300",
          !showDetail && "hidden"
        )}
      >
        {selectedSnippet ? (
          <>
            <header className="px-4 md:px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex flex-col min-w-0 overflow-x-auto scrollbar-none">
                  <h2 className="text-base md:text-lg font-headline font-semibold text-primary whitespace-nowrap">
                    {selectedSnippet.title}
                  </h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Added {selectedSnippet.createdAt ? new Date(selectedSnippet.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-2 items-center">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleRefactor}
                  disabled={isRefactoring}
                  className="h-8 md:h-9 px-2 md:px-3 gap-1 md:gap-2 border-accent text-accent hover:bg-accent/10"
                >
                  {isRefactoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 md:h-4 md:w-4" />}
                  <span className="hidden sm:inline">AI Refactor</span>
                  <span className="sm:hidden text-[10px]">Refactor</span>
                </Button>
                <Button 
                  size="sm"
                  onClick={copyToClipboard}
                  className={cn(
                    "h-8 md:h-9 px-2 md:px-3 gap-1 md:gap-2 transition-all duration-300",
                    isCopied ? "bg-green-600 hover:bg-green-700" : "bg-accent hover:bg-accent/90"
                  )}
                >
                  {isCopied ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : <Copy className="h-3 w-3 md:h-4 md:w-4" />}
                  <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                  <span className="sm:hidden text-[10px]">{isCopied ? "Done" : "Copy"}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => setIsDetailVisible(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </header>
            
            <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
              <div className="px-4 md:px-6 border-b bg-secondary/10 shrink-0 overflow-x-auto scrollbar-none">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full gap-2 text-xs md:text-sm">
                    <Code2 className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full gap-2 text-xs md:text-sm">
                    <Wand2 className="h-4 w-4" />
                    AI Insights
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0 p-0 outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden">
                <ScrollArea className="flex-1 bg-[#1e1e1e]">
                  <div className="p-4 md:p-6 w-max min-w-full min-h-full">
                    <pre className="font-code text-xs md:text-sm text-[#d4d4d4] leading-relaxed whitespace-pre font-normal">
                      <code>{selectedSnippet.code}</code>
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai" className="flex-1 m-0 p-0 outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0 bg-background overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
                    {!explanation && !isExplaining ? (
                      <div className="text-center py-10 md:py-20 border-2 border-dashed rounded-xl bg-white shadow-sm px-4">
                        <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-base md:text-lg font-semibold text-primary">Need an explanation?</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-6">Let AI breakdown this code for you.</p>
                        <Button onClick={handleExplain} className="bg-primary hover:bg-primary/90">
                          Generate Explanation
                        </Button>
                      </div>
                    ) : isExplaining ? (
                      <div className="space-y-4 py-10 text-center">
                        <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-accent mx-auto" />
                        <p className="text-xs md:text-sm text-muted-foreground animate-pulse">Analyzing code structure...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm md:text-base">
                          <Wand2 className="h-5 w-5" />
                          AI Analysis
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap text-xs md:text-sm">
                          {explanation}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setExplanation(null)} className="text-muted-foreground text-xs">
                          Clear Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12 bg-[#F8FAFB] relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
              onClick={() => setIsDetailVisible(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <FileCode className="h-8 w-8 md:h-10 md:w-10 text-accent/40" />
            </div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-primary mb-2">
              Welcome to SnippetVault
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
              Securely store, organize, and analyze your frequently used HTML components in this public repository.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
