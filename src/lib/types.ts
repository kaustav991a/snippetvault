
export interface SnippetFile {
  name: string;
  content: string;
  language: string;
}

export interface Snippet {
  id: string;
  title: string;
  tags?: string[];
  files: SnippetFile[];
  createdAt: number;
}
