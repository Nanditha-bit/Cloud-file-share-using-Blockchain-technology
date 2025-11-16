import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import { FileText, Search, Download, Share2, Trash2, Loader2, MessageCircle, Mail, Send, Copy, Shield, Image as ImageIcon, File, FileType, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileData {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  cid: string;
  created_at: string;
  blockchain_verified: boolean;
}

const Files = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'verified'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const checkAuthAndFetchFiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      await fetchFiles();
    };

    checkAuthAndFetchFiles();
  }, [navigate]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
      
      // Load thumbnails for image files
      if (data) {
        loadThumbnails(data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const loadThumbnails = async (fileList: FileData[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const imageFiles = fileList.filter(file => isImageFile(file.file_type));
    const newThumbnails: Record<string, string> = {};

    for (const file of imageFiles) {
      try {
        const { data: storageFiles } = await supabase.storage
          .from('user-files')
          .list(session.user.id);

        const storageFile = storageFiles?.find(f => f.name.includes(file.filename));
        
        if (storageFile) {
          const { data: signedUrlData } = await supabase.storage
            .from('user-files')
            .createSignedUrl(`${session.user.id}/${storageFile.name}`, 3600);

          if (signedUrlData) {
            newThumbnails[file.id] = signedUrlData.signedUrl;
          }
        }
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      }
    }

    setThumbnails(newThumbnails);
  };

  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.cid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (field: 'name' | 'date' | 'size' | 'verified') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
      case 'verified':
        comparison = (a.blockchain_verified === b.blockchain_verified) ? 0 : a.blockchain_verified ? -1 : 1;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getSortIcon = (field: 'name' | 'date' | 'size' | 'verified') => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map(f => f.id));
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete from storage - try with timestamp prefix pattern
      const { data: storageFiles } = await supabase.storage
        .from('user-files')
        .list(session.user.id);

      const fileToDelete = storageFiles?.find(f => f.name.includes(fileName));
      
      if (fileToDelete) {
        await supabase.storage
          .from('user-files')
          .remove([`${session.user.id}/${fileToDelete.name}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      toast.success(`${fileName} deleted successfully`);
      await fetchFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filesToDelete = files.filter(f => selectedFileIds.includes(f.id));
      
      // Delete from storage
      const { data: storageFiles } = await supabase.storage
        .from('user-files')
        .list(session.user.id);

      const storagePathsToDelete = filesToDelete
        .map(file => {
          const storageFile = storageFiles?.find(f => f.name.includes(file.filename));
          return storageFile ? `${session.user.id}/${storageFile.name}` : null;
        })
        .filter(Boolean) as string[];

      if (storagePathsToDelete.length > 0) {
        await supabase.storage
          .from('user-files')
          .remove(storagePathsToDelete);
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .in('id', selectedFileIds);

      if (error) throw error;
      
      toast.success(`${selectedFileIds.length} file(s) deleted successfully`);
      setSelectedFileIds([]);
      setBulkDeleteDialogOpen(false);
      await fetchFiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete files");
    }
  };

  const initiateDownload = (file: FileData) => {
    setSelectedFile(file);
    setDownloadDialogOpen(true);
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to download files");
        return;
      }

      // List files to find the one with timestamp
      const { data: storageFiles } = await supabase.storage
        .from('user-files')
        .list(session.user.id);

      const fileToDownload = storageFiles?.find(f => f.name.includes(selectedFile.filename));
      
      if (!fileToDownload) {
        toast.error("File not found in storage");
        return;
      }

      // Verify file ownership before download
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .select('user_id')
        .eq('id', selectedFile.id)
        .single();

      if (fileError || fileRecord.user_id !== session.user.id) {
        toast.error("Unauthorized access");
        return;
      }

      const { data, error } = await supabase.storage
        .from('user-files')
        .download(`${session.user.id}/${fileToDownload.name}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded securely!");
      setDownloadDialogOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || "Failed to download file");
    }
  };

  const handleShare = (file: FileData, platform: string) => {
    const fileUrl = `${window.location.origin}/verify?cid=${file.cid}`;
    const text = `Check out my file: ${file.filename}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${fileUrl}`)}`, '_blank');
        break;
      case 'gmail':
        window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(file.filename)}&body=${encodeURIComponent(`${text}\n\n${fileUrl}`)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(fileUrl)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(fileUrl);
        toast.success("Link copied to clipboard!");
        break;
      default:
        break;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileTypeCategory = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Images';
    if (fileType === 'application/pdf') return 'PDFs';
    if (fileType.includes('word') || fileType.includes('document')) return 'Documents';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Spreadsheets';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentations';
    if (fileType.startsWith('video/')) return 'Videos';
    if (fileType.startsWith('audio/')) return 'Audio';
    return 'Other';
  };

  const fileTypeBreakdown = files.reduce((acc, file) => {
    const category = getFileTypeCategory(file.file_type);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Files</h1>
          <p className="text-muted-foreground">
            Manage and verify your decentralized files
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Files</p>
                  <p className="text-3xl font-bold">{files.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Storage</p>
                  <p className="text-3xl font-bold">
                    {formatFileSize(files.reduce((acc, file) => acc + file.file_size, 0))}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Type Breakdown */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileType className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">File Type Breakdown</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(fileTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar and Bulk Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename or CID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredFiles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2"
                    >
                      {selectedFileIds.length === filteredFiles.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {selectedFileIds.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedFileIds.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => setBulkDeleteDialogOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedFileIds.length})
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sort Options */}
              {filteredFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Button
                    variant={sortBy === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2"
                  >
                    Name
                    {getSortIcon('name')}
                  </Button>
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2"
                  >
                    Date
                    {getSortIcon('date')}
                  </Button>
                  <Button
                    variant={sortBy === 'size' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('size')}
                    className="flex items-center gap-2"
                  >
                    Size
                    {getSortIcon('size')}
                  </Button>
                  <Button
                    variant={sortBy === 'verified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('verified')}
                    className="flex items-center gap-2"
                  >
                    Status
                    {getSortIcon('verified')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading files...</p>
              </CardContent>
            </Card>
          ) : filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No files match your search" : "No files uploaded yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedFiles.map((file) => (
              <Card key={file.id} className="hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFileSelection(file.id)}
                        className="flex-shrink-0"
                      >
                        {selectedFileIds.includes(file.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        {isImageFile(file.file_type) && thumbnails[file.id] ? (
                          <img 
                            src={thumbnails[file.id]} 
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : isImageFile(file.file_type) ? (
                          <ImageIcon className="w-6 h-6 text-primary" />
                        ) : (
                          <FileText className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{file.filename}</h3>
                          <Badge 
                            variant={file.blockchain_verified ? "default" : "secondary"}
                            className="flex-shrink-0"
                          >
                            {file.blockchain_verified ? "verified" : "pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)} • Uploaded {formatDate(file.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                          CID: {file.cid}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => initiateDownload(file)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" title="Share">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShare(file, 'whatsapp')}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file, 'gmail')}>
                            <Mail className="w-4 h-4 mr-2" />
                            Gmail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file, 'telegram')}>
                            <Send className="w-4 h-4 mr-2" />
                            Telegram
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file, 'copy')}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id, file.filename)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Download Confirmation Dialog */}
      <AlertDialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Secure Download Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to download: <strong>{selectedFile?.filename}</strong>
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verify your ownership of this file</li>
                <li>Create a secure temporary download link</li>
                <li>Download the file to your device</li>
              </ul>
              <br />
              Please confirm to proceed with the secure download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownload}>Download Securely</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Multiple Files
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <strong>{selectedFileIds.length} file(s)</strong>.
              <br /><br />
              This action cannot be undone. The files will be permanently removed from:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your secure storage</li>
                <li>The database records</li>
                <li>IPFS (if applicable)</li>
              </ul>
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Files;
