
"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Code2, Copy, Trash2, FileCode, Check, Sidebar as SidebarIcon, Loader2, Wand2, BookOpen, Sparkles } from "lucide-react"
import { Snippet } from "@/lib/types"
import { AddSnippetDialog } from "./AddSnippetDialog"
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

export default function SnippetVault() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // AI States
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isRefactoring, setIsRefactoring] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Firebase Query - Simple collection reference to avoid index issues
  const snippetsCollectionRef = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "snippets")
  }, [db])

  const { data: snippetsData = [], loading: snippetsLoading } = useCollection<Snippet>(snippetsCollectionRef)

  // Sort snippets locally for now to ensure they show up immediately
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

  // Reset AI states when snippet changes
  useEffect(() => {
    setExplanation(null)
  }, [selectedId])

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
    toast({
      title: "Snippet deleted",
    })
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
      toast({
        title: "AI Refactor failed",
        variant: "destructive",
      })
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
      toast({
        title: "Copied!",
        description: "Snippet copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-body">
      {/* Sidebar */}
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
            {isSidebarOpen && <span className="font-headline font-bold text-primary tracking-tight text-xl">Vault</span>}
          </div>

          <div className="flex-1 space-y-4">
            <AddSnippetDialog />
          </div>

          <div className="mt-auto space-y-4">
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              {isSidebarOpen && <span>{snippets.length} snippets stored</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main List */}
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
                      {snippet.title || "Untitled Snippet"}
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
                    {snippet.code?.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Detail Panel */}
      <section className="flex-[2] flex flex-col bg-white overflow-hidden">
        {selectedSnippet ? (
          <>
            <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <div className="flex flex-col">
                <h2 className="text-lg font-headline font-semibold text-primary">{selectedSnippet.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Added {selectedSnippet.createdAt ? new Date(selectedSnippet.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleRefactor}
                  disabled={isRefactoring}
                  className="gap-2 border-accent text-accent hover:bg-accent/10"
                >
                  {isRefactoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Refactor
                </Button>
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
              </div>
            </header>
            
            <Tabs defaultValue="code" className="flex-1 flex flex-col">
              <div className="px-6 border-b bg-secondary/10">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full gap-2">
                    <Code2 className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Insights
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0 p-0 overflow-hidden">
                <ScrollArea className="h-full bg-[#1e1e1e]">
                  <div className="p-6">
                    <pre className="font-code text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap break-all">
                      <code>{selectedSnippet.code}</code>
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai" className="flex-1 m-0 p-6 overflow-hidden bg-background">
                <div className="max-w-3xl mx-auto space-y-6">
                  {!explanation && !isExplaining ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-white shadow-sm">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-primary">Need an explanation?</h3>
                      <p className="text-muted-foreground mb-6">Let AI breakdown this code for you.</p>
                      <Button onClick={handleExplain} className="bg-primary hover:bg-primary/90">
                        Generate Explanation
                      </Button>
                    </div>
                  ) : isExplaining ? (
                    <div className="space-y-4 py-10 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
                      <p className="text-muted-foreground animate-pulse">Analyzing code structure...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Wand2 className="h-5 w-5" />
                        AI Analysis
                      </div>
                      <div className="bg-white p-6 rounded-xl border shadow-sm prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                        {explanation}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setExplanation(null)} className="text-muted-foreground">
                        Clear Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#F8FAFB]">
            <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <FileCode className="h-10 w-10 text-accent/40" />
            </div>
            <h2 className="text-xl font-headline font-bold text-primary mb-2">
              Welcome to SnippetVault
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Securely store, organize, and analyze your frequently used HTML components in this public repository.
            </p>
          </div>
        )}
      </section>

      {/* Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-primary text-white rounded-full shadow-lg md:hidden"
      >
        <SidebarIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
