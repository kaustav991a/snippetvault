
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Pencil, Wand2, Loader2, X, Plus } from "lucide-react"
import { suggestSnippetTitle } from "@/ai/flows/ai-suggest-snippet-title"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Snippet, SnippetFile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface EditSnippetDialogProps {
  snippet: Snippet
}

export function EditSnippetDialog({ snippet }: EditSnippetDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(snippet.title)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(snippet.tags || [])
  const [files, setFiles] = useState<SnippetFile[]>(snippet.files || [{ name: "index.html", content: "", language: "html" }])
  const [isSuggesting, setIsSuggesting] = useState(false)
  
  const db = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    setTitle(snippet.title)
    setTags(snippet.tags || [])
    setFiles(snippet.files || [{ name: "index.html", content: "", language: "html" }])
  }, [snippet])

  const handleSuggestTitle = async () => {
    const mainFile = files[0]?.content
    if (!mainFile?.trim()) return
    setIsSuggesting(true)
    try {
      const result = await suggestSnippetTitle({ htmlCode: mainFile })
      setTitle(result.title)
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
    setFiles(newFiles)
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().replace(/^#/, '')
      if (!tags.includes(newTag)) setTags([...tags, newTag])
      setTagInput("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !db) return

    const snippetRef = doc(db, "snippets", snippet.id)
    const updateData = {
      title,
      tags,
      files,
    }

    updateDoc(snippetRef, updateData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: snippetRef.path,
          operation: 'update',
          requestResourceData: updateData
        })
        errorEmitter.emit('permission-error', permissionError)
      })

    setOpen(false)
    toast({ title: "Snippet updated" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-primary hover:text-primary hover:bg-primary/10 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-semibold text-primary">Edit Snippet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-title" className="text-sm font-medium">Title</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleSuggestTitle} disabled={isSuggesting} className="h-7">
                   {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                </Button>
              </div>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-2 py-0">
                    #{tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Files</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addFile} className="h-7 text-primary">
                <Plus className="h-3 w-3" /> Add File
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {files.map((file, index) => (
                <div key={index} className="space-y-2 border p-3 rounded-lg bg-secondary/10">
                  <div className="flex gap-2">
                    <Input value={file.name} onChange={(e) => updateFile(index, { name: e.target.value })} className="h-8 text-xs font-code w-40" />
                    {files.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => removeFile(index)}><X className="h-4 w-4" /></Button>}
                  </div>
                  <Textarea className="font-code text-xs bg-white min-h-[150px] resize-none" value={file.content} onChange={(e) => updateFile(index, { content: e.target.value })} required />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 shrink-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
