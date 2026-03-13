
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Code2, Copy, Trash2, FileCode, Check, Loader2, Wand2, BookOpen, Sparkles, PanelLeftClose, PanelLeft, GripVertical, X, Tag, Stethoscope, ShieldCheck, AlertCircle } from "lucide-react"
import { Snippet, SnippetFile } from "@/lib/types"
import { AddSnippetDialog } from "./AddSnippetDialog"
import { EditSnippetDialog } from "./EditSnippetDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { explainSnippet } from "@/ai/flows/ai-explain-snippet"
import { refactorSnippet } from "@/ai/flows/ai-refactor-snippet"
import { diagnoseCode, DiagnoseCodeOutput } from "@/ai/flows/ai-code-doctor"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function SnippetVault() {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeFileIndex, setActiveFileIndex] = useState(0)
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
  
  // Code Doctor States
  const [diagnosis, setDiagnosis] = useState<DiagnoseCodeOutput | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)

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

  const { data: snippetsData = [], loading: snippetsLoading } = useCollection<any>(snippetsCollectionRef)

  // Migration logic for old schema (single code block -> files)
  const snippets: Snippet[] = useMemo(() => {
    return [...snippetsData].map(s => ({
      ...s,
      files: s.files || (s.code ? [{ name: "index.html", content: s.code, language: "html" }] : [])
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [snippetsData])

  const filteredSnippets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return snippets
    
    return snippets.filter(s => {
      const matchText = s.title?.toLowerCase().includes(q) || s.files?.some(f => f.content.toLowerCase().includes(q))
      const matchTags = s.tags?.some(t => t.toLowerCase().includes(q.replace(/^#/, '')))
      return matchText || matchTags
    })
  }, [snippets, searchQuery])

  const selectedSnippet = useMemo(() => {
    return snippets.find(s => s.id === selectedId) || null
  }, [snippets, selectedId])

  useEffect(() => {
    setExplanation(null)
    setDiagnosis(null)
    setActiveFileIndex(0)
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
    }
  }, [isResizing, resize, stopResizing])

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!db) return
    const docRef = doc(db, "snippets", id)
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }))
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
      const codeToAnalyze = selectedSnippet.files.map(f => `File: ${f.name}\n${f.content}`).join('\n\n')
      const result = await explainSnippet({ htmlCode: codeToAnalyze })
      setExplanation(result.explanation)
    } catch (error) {
      toast({ title: "AI Analysis failed", variant: "destructive" })
    } finally {
      setIsExplaining(false)
    }
  }

  const handleRefactor = async () => {
    if (!selectedSnippet || !db) return
    setIsRefactoring(true)
    try {
      const activeFile = selectedSnippet.files[activeFileIndex]
      const result = await refactorSnippet({ htmlCode: activeFile.content })
      
      const newFiles = [...selectedSnippet.files]
      newFiles[activeFileIndex] = { ...activeFile, content: result.refactoredCode }
      
      const snippetRef = doc(db, "snippets", selectedSnippet.id)
      await updateDoc(snippetRef, { files: newFiles })

      toast({ title: "AI Refactor Complete" })
    } catch (error) {
      toast({ title: "AI Refactor failed", variant: "destructive" })
    } finally {
      setIsRefactoring(false)
    }
  }

  const handleDiagnose = async () => {
    if (!selectedSnippet) return
    setIsDiagnosing(true)
    try {
      const result = await diagnoseCode({ files: selectedSnippet.files.map(f => ({ name: f.name, content: f.content })) })
      setDiagnosis(result)
    } catch (error) {
      toast({ title: "Code Diagnosis failed", variant: "destructive" })
    } finally {
      setIsDiagnosing(false)
    }
  }

  const copyToClipboard = async () => {
    if (!selectedSnippet) return
    try {
      const activeFile = selectedSnippet.files[activeFileIndex]
      await navigator.clipboard.writeText(activeFile.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({ title: "Copied!", description: `File ${activeFile.name} copied.` })
    } catch (err) {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  if (!mounted) return null

  const showDetail = isDetailVisible && (!!selectedSnippet || !isMobile)
  const showList = !isMobile || !isDetailVisible

  return (
    <div className={cn("flex h-screen w-full bg-background overflow-hidden font-body relative", isResizing && "cursor-col-resize select-none")}>
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={cn("bg-white border-r flex flex-col transition-all duration-300 ease-in-out shrink-0 z-50 fixed md:relative h-full overflow-hidden", isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-0 md:translate-x-0")}>
        <div className="p-4 flex flex-col gap-6 h-full w-64">
          <div className="flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0"><FileCode className="h-5 w-5" /></div>
              <span className="font-headline font-bold text-primary tracking-tight text-xl text-nowrap">SnippetVault</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-none"><AddSnippetDialog /></div>
          <div className="mt-auto space-y-4 shrink-0">
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>{snippets.length} snippets</span></div>
          </div>
        </div>
      </aside>

      <main style={{ width: (!isMobile && showDetail) ? `${listWidth}px` : undefined }} className={cn("flex flex-col bg-[#F8FAFB] border-r h-full overflow-hidden relative", (!isMobile && showDetail) ? "shrink-0" : "flex-1", (!isResizing && !isMobile) && "transition-all duration-300", (!showList) && "hidden md:flex")}>
        <header className="p-4 border-b bg-white shrink-0 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tags #ui or text..." className="pl-9 bg-secondary/20 border-none focus-visible:ring-accent w-full h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1 w-full min-w-0 block">
            {snippetsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
                  className={cn("group relative p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent", selectedId === snippet.id ? "bg-white border-accent shadow-sm" : "hover:border-secondary")}
                >
                  <div className="flex justify-between items-start gap-2 mb-1 min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className={cn("text-xs font-semibold truncate", selectedId === snippet.id ? "text-primary" : "text-foreground")}>{snippet.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {snippet.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">#{tag}</Badge>)}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 items-center">
                      <EditSnippetDialog snippet={snippet} />
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => handleDeleteSnippet(snippet.id, e)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      {!isMobile && showDetail && (
        <div onMouseDown={startResizing} className={cn("w-2 h-full cursor-col-resize hover:bg-accent/30 transition-colors z-20 flex items-center justify-center group relative shrink-0", isResizing && "bg-accent/50")}>
          <div className="w-[1px] h-full bg-border" />
          <div className={cn("absolute transition-all duration-200 bg-accent rounded-full p-1 shadow-md z-30", isResizing ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100 scale-100")}><GripVertical className="h-3 w-3 text-white" /></div>
        </div>
      )}

      <section className={cn("flex-1 flex flex-col bg-white overflow-hidden h-full min-w-0 relative z-10", (!isResizing && !isMobile) && "transition-all duration-300", (!showDetail) && "hidden md:flex")}>
        {selectedSnippet ? (
          <>
            <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <h2 className="text-lg font-headline font-semibold text-primary truncate">{selectedSnippet.title}</h2>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                    {selectedSnippet.tags?.map(tag => <Badge key={tag} variant="outline" className="text-[10px] whitespace-nowrap">#{tag}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <Button variant="outline" size="sm" onClick={handleRefactor} disabled={isRefactoring} className="h-8 gap-1 border-accent text-accent hover:bg-accent/10">
                  {isRefactoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">AI Refactor</span>
                </Button>
                <Button size="sm" onClick={copyToClipboard} className={cn("h-8 gap-1 transition-all duration-300", isCopied ? "bg-green-600" : "bg-accent")}>
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDetailVisible(false)}><X className="h-5 w-5" /></Button>
              </div>
            </header>
            
            <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 border-b bg-secondary/10 shrink-0">
                <TabsList className="bg-transparent h-10">
                  <TabsTrigger value="code" className="rounded-none h-full gap-2 text-xs"> <Code2 className="h-3.5 w-3.5" /> Code </TabsTrigger>
                  <TabsTrigger value="ai" className="rounded-none h-full gap-2 text-xs"> <Wand2 className="h-3.5 w-3.5" /> Insights </TabsTrigger>
                  <TabsTrigger value="doctor" className="rounded-none h-full gap-2 text-xs"> <Stethoscope className="h-3.5 w-3.5" /> Doctor </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0 p-0 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-[#2d2d2d] border-b border-white/5 overflow-x-auto scrollbar-none">
                  {selectedSnippet.files.map((file, idx) => (
                    <Button 
                      key={idx} 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveFileIndex(idx)}
                      className={cn("h-7 text-[10px] font-code px-3 text-white/60 hover:text-white hover:bg-white/10", activeFileIndex === idx && "bg-white/10 text-white")}
                    >
                      {file.name}
                    </Button>
                  ))}
                </div>
                <ScrollArea className="flex-1 bg-[#1e1e1e]">
                  <SyntaxHighlighter
                    language={selectedSnippet.files[activeFileIndex]?.language || 'javascript'}
                    style={vscDarkPlus}
                    wrapLongLines={true}
                    customStyle={{ 
                      margin: 0, 
                      padding: '1.5rem', 
                      fontSize: '13px', 
                      lineHeight: '1.6', 
                      background: 'transparent',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {selectedSnippet.files[activeFileIndex]?.content || ''}
                  </SyntaxHighlighter>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="ai" className="flex-1 m-0 p-0 bg-background overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-6 max-w-3xl mx-auto space-y-6">
                    {!explanation && !isExplaining ? (
                      <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary">AI Analysis</h3>
                        <Button onClick={handleExplain} className="mt-4 bg-primary">Generate Explanation</Button>
                      </div>
                    ) : isExplaining ? (
                      <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl border shadow-sm prose prose-sm text-xs md:text-sm whitespace-pre-wrap">{explanation}</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="doctor" className="flex-1 m-0 p-0 bg-background overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-6 max-w-3xl mx-auto space-y-6">
                    {!diagnosis && !isDiagnosing ? (
                      <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary">Code Doctor Analysis</h3>
                        <p className="text-xs text-muted-foreground mb-6">Check for A11y, Performance, and Best Practices.</p>
                        <Button onClick={handleDiagnose} className="bg-primary">Diagnose Snippet</Button>
                      </div>
                    ) : isDiagnosing ? (
                      <div className="text-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
                        <p className="text-xs text-muted-foreground mt-2">Doctor is performing diagnosis...</p>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-white", (diagnosis?.analysis?.score || 0) > 80 ? "bg-green-500" : "bg-orange-500")}>
                                {diagnosis?.analysis?.score}%
                              </div>
                              <div>
                                <h4 className="text-sm font-bold">Health Score</h4>
                                <p className="text-[10px] text-muted-foreground">Based on industry standards</p>
                              </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white border rounded-lg">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Accessibility</h5>
                              <p className="text-xs">{diagnosis?.analysis?.accessibility}</p>
                            </div>
                            <div className="p-4 bg-white border rounded-lg">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Performance</h5>
                              <p className="text-xs">{diagnosis?.analysis?.performance}</p>
                            </div>
                            <div className="p-4 bg-white border rounded-lg">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Best Practices</h5>
                              <p className="text-xs">{diagnosis?.analysis?.bestPractices}</p>
                            </div>
                         </div>

                         <div className="space-y-3">
                           <h4 className="text-sm font-bold flex items-center gap-2">
                             <AlertCircle className="h-4 w-4 text-orange-500" />
                             Doctor's Orders
                           </h4>
                           <div className="space-y-2">
                             {diagnosis?.recommendations.map((rec, i) => (
                               <div key={i} className="flex gap-3 p-3 bg-orange-50 rounded-md border border-orange-100 text-xs text-orange-900">
                                 <span className="font-bold">{i+1}.</span>
                                 {rec}
                               </div>
                             ))}
                           </div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setDiagnosis(null)} className="text-muted-foreground text-[10px]">New Diagnosis</Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#F8FAFB]">
             <FileCode className="h-12 w-12 text-accent/40 mb-6" />
             <h2 className="text-xl font-headline font-bold text-primary mb-2">Welcome to SnippetVault</h2>
             <p className="text-sm text-muted-foreground max-w-sm">Select a snippet to view code, tags, and get AI insights.</p>
          </div>
        )}
      </section>
    </div>
  )
}
