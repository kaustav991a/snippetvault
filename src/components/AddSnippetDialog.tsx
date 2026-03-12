
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Wand2, Loader2 } from "lucide-react"
import { suggestSnippetTitle } from "@/ai/flows/ai-suggest-snippet-title"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export function AddSnippetDialog() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSuggestTitle = async () => {
    if (!code.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some HTML code first to get a title suggestion.",
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
    if (!title.trim() || !code.trim() || !db || !user) return

    const snippetData = {
      title,
      code,
      createdAt: Date.now(),
    }

    const snippetsRef = collection(db, "users", user.uid, "snippets")
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
    setCode("")
    setOpen(false)
    toast({
      title: "Snippet added",
      description: "Your snippet has been successfully stored.",
    })
  }

  const triggerButton = (
    <Button disabled={!user} className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-semibold text-primary">New Code Snippet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium">Description / Title</Label>
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
              id="title"
              placeholder="e.g. Basic HTML5 Boilerplate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">HTML Code</Label>
            <Textarea
              id="code"
              placeholder="Paste your HTML here..."
              className="font-code min-h-[300px] bg-secondary/30 resize-none"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">Save Snippet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
