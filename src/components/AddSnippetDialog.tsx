
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Wand2, Loader2, X, FileCode } from "lucide-react"
import { suggestSnippetTitle } from "@/ai/flows/ai-suggest-snippet-title"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { SnippetFile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export function AddSnippetDialog() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [files, setFiles] = useState<SnippetFile[]>([{ name: "index.html", content: "", language: "html" }])
  const [isSuggesting, setIsSuggesting] = useState(false)
  
  const db = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSuggestTitle = async () => {
    const mainFile = files[0]?.content
    if (!mainFile?.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some code in the first file to get a title suggestion.",
        variant: "destructive",
      })
      return
    }

    setIsSuggesting(true)
    try {
      const result = await suggestSnippetTitle({ htmlCode: mainFile })
      setTitle(result.title)
    } catch (error) {
      toast({
        title: "Suggestion failed",
        variant: "destructive",
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  const addFile = () => {
    setFiles([...files, { name: "new-file.txt", content: "", language: "plaintext" }])
  }

  const removeFile = (index: number) => {
    if (files.length === 1) return
    setFiles(files.filter((_, i) => i !== index))
  }

  const updateFile = (index: number, updates: Partial<SnippetFile>) => {
    const newFiles = [...files]
    newFiles[index] = { ...newFiles[index], ...updates }
    
    // Auto-detect language from extension
    if (updates.name) {
      const ext = updates.name.split('.').pop()?.toLowerCase()
      if (ext === 'html') newFiles[index].language = 'html'
      else if (ext === 'css') newFiles[index].language = 'css'
      else if (ext === 'js') newFiles[index].language = 'javascript'
      else if (ext === 'ts') newFiles[index].language = 'typescript'
    }
    
    setFiles(newFiles)
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().replace(/^#/, '')
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || files.some(f => !f.content.trim()) || !db) return

    const snippetData = {
      title,
      tags,
      files,
      createdAt: Date.now(),
    }

    const snippetsRef = collection(db, "snippets")
    addDoc(snippetsRef, snippetData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: snippetsRef.path,
          operation: 'create',
          requestResourceData: snippetData
        })
        errorEmitter.emit('permission-error', permissionError)
      })

    setTitle("")
    setTags([])
    setFiles([{ name: "index.html", content: "", language: "html" }])
    setOpen(false)
    toast({
      title: "Snippet added",
      description: "Your snippet has been successfully stored.",
    })
  }

  const triggerButton = (
    <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
      <Plus className="h-4 w-4" />
      <span>Add New Snippet</span>
    </Button>
  )

  if (!mounted) {
    return triggerButton
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-semibold text-primary">New Code Snippet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 gap-1 border-accent text-accent hover:bg-accent/10"
                  onClick={handleSuggestTitle}
                  disabled={isSuggesting}
                >
                  {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  AI Suggest
                </Button>
              </div>
              <Input
                id="title"
                placeholder="e.g. Navigation Menu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">Tags (Press Enter)</Label>
              <Input
                id="tags"
                placeholder="e.g. layout, forms"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-2 py-0">
                    #{tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Files</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addFile} className="h-7 gap-1 text-primary">
                <Plus className="h-3 w-3" />
                Add File
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {files.map((file, index) => (
                <div key={index} className="space-y-2 border p-3 rounded-lg relative bg-secondary/10">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="filename.ext" 
                      value={file.name} 
                      onChange={(e) => updateFile(index, { name: e.target.value })}
                      className="h-8 text-xs font-code w-40"
                    />
                    <select 
                      value={file.language} 
                      onChange={(e) => updateFile(index, { language: e.target.value })}
                      className="h-8 text-[10px] rounded-md border border-input bg-background px-2"
                    >
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="javascript">JS</option>
                      <option value="typescript">TS</option>
                      <option value="plaintext">Text</option>
                    </select>
                    {files.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 ml-auto text-destructive hover:bg-destructive/10"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="File content..."
                    className="font-code text-xs bg-white min-h-[150px] resize-none"
                    value={file.content}
                    onChange={(e) => updateFile(index, { content: e.target.value })}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 shrink-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">Save Snippet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
