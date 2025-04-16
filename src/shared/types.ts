export interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  sourceUrl?: string;
  isFavorite: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  snippetCount: number;
}
