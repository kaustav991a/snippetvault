"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Pencil, Wand2, Loader2 } from "lucide-react"
import { suggestSnippetTitle } from "@/ai/flows/ai-suggest-snippet-title"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Snippet } from "@/lib/types"

interface EditSnippetDialogProps {
  snippet: Snippet
}

export function EditSnippetDialog({ snippet }: EditSnippetDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(snippet.title)
  const [code, setCode] = useState(snippet.code)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  // Update internal state when snippet prop changes
  useEffect(() => {
    setTitle(snippet.title)
    setCode(snippet.code)
  }, [snippet])

  const handleSuggestTitle = async () => {
    if (!code.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some code first to get a title suggestion.",
        variant: "destructive",
      })
      return
    }

    setIsSuggesting(true)
    try {
      const result = await suggestSnippetTitle({ htmlCode: code })
      setTitle(result.title)
    } catch (error) {
      toast({
        title: "Suggestion failed",
        description: "Could not generate a title suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !code.trim() || !db) return

    const snippetRef = doc(db, "snippets", snippet.id)
    const updateData = {
      title,
      code,
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
    toast({
      title: "Snippet updated",
      description: "Changes have been saved.",
    })
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-semibold text-primary">Edit Snippet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-title" className="text-sm font-medium">Description / Title</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 border-accent text-accent hover:bg-accent/10"
                onClick={handleSuggestTitle}
                disabled={isSuggesting}
              >
                {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI Suggest
              </Button>
            </div>
            <Input
              id="edit-title"
              placeholder="e.g. Basic HTML5 Boilerplate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-code" className="text-sm font-medium">Code Snippet</Label>
            <Textarea
              id="edit-code"
              placeholder="Paste your HTML here..."
              className="font-code min-h-[300px] bg-secondary/30 resize-none"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
