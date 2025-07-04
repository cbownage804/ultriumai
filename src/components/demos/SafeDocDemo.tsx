import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Folder,
  Search,
  Plus,
  Users,
  Clock,
  Star,
  Download,
  Share,
  Lock,
  Eye,
  Filter
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  category: string;
  type: string;
  author: string;
  lastModified: string;
  size: string;
  tags: string[];
  favorite: boolean;
  shared: boolean;
  version: string;
}

interface Folder {
  id: string;
  name: string;
  documentCount: number;
  lastModified: string;
  icon: React.ComponentType<any>;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "IT Security Policy 2024",
    category: "Policies",
    type: "PDF",
    author: "John Smith",
    lastModified: "2 hours ago",
    size: "2.4 MB",
    tags: ["Security", "Policy", "Compliance"],
    favorite: true,
    shared: true,
    version: "v2.1"
  },
  {
    id: "2",
    title: "Network Diagram - Main Office",
    category: "Infrastructure",
    type: "Visio",
    author: "Sarah Johnson",
    lastModified: "1 day ago", 
    size: "856 KB",
    tags: ["Network", "Infrastructure", "Diagram"],
    favorite: false,
    shared: false,
    version: "v1.3"
  },
  {
    id: "3",
    title: "Backup Procedures",
    category: "Procedures",
    type: "Word",
    author: "Mike Davis",
    lastModified: "3 days ago",
    size: "1.2 MB",
    tags: ["Backup", "Procedure", "DR"],
    favorite: true,
    shared: true,
    version: "v1.0"
  },
  {
    id: "4",
    title: "Client Onboarding Checklist",
    category: "Templates",
    type: "Excel",
    author: "Lisa Wilson",
    lastModified: "1 week ago",
    size: "245 KB",
    tags: ["Onboarding", "Checklist", "Client"],
    favorite: false,
    shared: true,
    version: "v3.2"
  }
];

const mockFolders: Folder[] = [
  { id: "1", name: "IT Policies", documentCount: 12, lastModified: "2 hours ago", icon: Lock },
  { id: "2", name: "Network Documentation", documentCount: 8, lastModified: "1 day ago", icon: FileText },
  { id: "3", name: "Client Files", documentCount: 24, lastModified: "3 days ago", icon: Users },
  { id: "4", name: "Procedures", documentCount: 15, lastModified: "1 week ago", icon: Folder }
];

export const SafeDocDemo = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [documents] = useState<Document[]>(mockDocuments);
  const [folders] = useState<Folder[]>(mockFolders);

  const categories = ["all", "Policies", "Infrastructure", "Procedures", "Templates"];
  
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'word': return '📝';
      case 'excel': return '📊';
      case 'visio': return '🗺️';
      default: return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeDoc Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Secure document storage and knowledge management platform for IT teams and MSPs
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, tags, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === "all" ? "All Categories" : category}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getFileIcon(doc.type)}</div>
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{doc.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {doc.category} • {doc.type} • {doc.size}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {doc.shared && <Share className="h-4 w-4 text-blue-500" />}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div>By {doc.author}</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {doc.lastModified}
                        </div>
                        <div>Version {doc.version}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="folders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <folder.icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                    <CardDescription>
                      {folder.documentCount} documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {folder.lastModified}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getFileIcon(doc.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.category} • Modified {doc.lastModified} by {doc.author}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};