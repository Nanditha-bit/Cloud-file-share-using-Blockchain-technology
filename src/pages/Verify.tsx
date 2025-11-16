import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { Shield, CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Verify = () => {
  const [cid, setCid] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    fileName?: string;
    uploadDate?: string;
    fileSize?: string;
    blockchainVerified?: boolean;
  } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Query the database for the CID
      const { data, error } = await supabase
        .from('files')
        .select('filename, file_size, created_at, blockchain_verified')
        .eq('cid', cid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVerificationResult({
          verified: true,
          fileName: data.filename,
          uploadDate: new Date(data.created_at).toLocaleDateString(),
          fileSize: formatFileSize(data.file_size),
          blockchainVerified: data.blockchain_verified,
        });
        toast.success("File found in the system");
      } else {
        setVerificationResult({
          verified: false,
        });
        toast.error("File not found in the system");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify file");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Verify File</h1>
            <p className="text-muted-foreground">
              Check if a file exists on the blockchain using its CID
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter File CID</CardTitle>
              <CardDescription>
                Content Identifier from IPFS (starts with "Qm")
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cid">CID (Content Identifier)</Label>
                  <Input
                    id="cid"
                    placeholder="QmX7fK9jxT2hN3pL5rB8qWv..."
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || !cid}
                >
                  {isVerifying ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify on Blockchain
                    </>
                  )}
                </Button>
              </form>

              {verificationResult && (
                <div className="mt-6 p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      verificationResult.verified 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {verificationResult.verified ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {verificationResult.verified 
                          ? "File Verified ✓" 
                          : "File Not Found"}
                      </h3>
                      
                      {verificationResult.verified ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">File Name:</span>
                            <span className="font-medium">{verificationResult.fileName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">File Size:</span>
                            <span className="font-medium">{verificationResult.fileSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Upload Date:</span>
                            <span className="font-medium">{verificationResult.uploadDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Blockchain Status:</span>
                            <span className="font-medium">
                              {verificationResult.blockchainVerified ? "Verified ✓" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This CID is not registered in the system or doesn't exist.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                How Verification Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  1
                </div>
                <p>
                  Enter the IPFS Content Identifier (CID) of the file you want to verify
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  2
                </div>
                <p>
                  The system queries the database to check if the CID is registered
                </p>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  3
                </div>
                <p>
                  If found, you'll see the file details and ownership information
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Verify;
