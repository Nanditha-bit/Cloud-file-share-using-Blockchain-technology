import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Upload, FileText, CheckCircle2, Video, Music } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!userId) {
      toast.error("Please log in to upload files");
      return;
    }

    // Validate files before uploading
    const emptyFiles: string[] = [];
    const validFiles = files.filter(file => {
      if (file.size === 0) {
        emptyFiles.push(file.name);
        return false;
      }
      return true;
    });

    // Show warning for empty files
    if (emptyFiles.length > 0) {
      const fileNames = emptyFiles.join(', ');
      toast.error(
        emptyFiles.length === 1
          ? `"${fileNames}" is empty (0 bytes) and cannot be uploaded`
          : `${emptyFiles.length} files are empty (0 bytes) and cannot be uploaded: ${fileNames}`
      );
    }

    // If no valid files, return early
    if (validFiles.length === 0) {
      toast.error("No valid files to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(((i + 0.3) / validFiles.length) * 100);
        
        // 1. Upload file to Supabase Storage
        const filePath = `${userId}/${Date.now()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (storageError) throw storageError;

        setUploadProgress(((i + 0.6) / validFiles.length) * 100);

        // 2. Upload to IPFS via edge function
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        const ipfsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-ipfs`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!ipfsResponse.ok) {
          const errorData = await ipfsResponse.json();
          throw new Error(errorData.error || 'Failed to upload to IPFS');
        }

        const { cid } = await ipfsResponse.json();

        setUploadProgress(((i + 0.9) / validFiles.length) * 100);

        // 3. Save file metadata to database
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            filename: file.name,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            cid: cid,
            user_id: userId,
          })
          .select()
          .single();
        
        if (dbError) throw dbError;

        // 4. Verify on blockchain in background
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-blockchain`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: fileData.id, cid }),
          }
        ).catch(err => console.error('Blockchain verification failed:', err));
        
        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }
      
      setIsUploading(false);
      setUploadProgress(100);
      toast.success(`${validFiles.length} file(s) uploaded to IPFS successfully!`);
      
      // Navigate to files page after a short delay
      setTimeout(() => navigate("/files"), 1000);
    } catch (error: any) {
      setIsUploading(false);
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload files");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Files</h1>
          <p className="text-muted-foreground">
            Securely upload videos, audio, documents, and any file type to decentralized storage
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload to IPFS</CardTitle>
                <CardDescription>
                  Drag and drop files or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                    ${isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium mb-1">
                        {isDragging ? "Drop files here" : "Upload your files"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports videos, audio, documents, and all file types
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Video className="w-4 h-4" />
                          <span>Videos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Music className="w-4 h-4" />
                          <span>Audio</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>Documents</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" disabled={isUploading}>
                      Browse Files
                    </Button>
                  </div>
                </div>

                {isUploading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploading to secure storage...</span>
                      <span className="font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground text-center">
                      Large files may take a few moments to process
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium mb-1">Upload File</p>
                    <p className="text-sm text-muted-foreground">
                      Select or drag files to upload
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium mb-1">IPFS Storage</p>
                    <p className="text-sm text-muted-foreground">
                      File stored on decentralized network
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium mb-1">Blockchain Record</p>
                    <p className="text-sm text-muted-foreground">
                      CID recorded on blockchain
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    End-to-end encryption
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Blockchain verification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Decentralized storage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Immutable records
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
