import { Card, CardContent } from "@/components/ui/card";

export const Requirements = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-2">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-8">
              {/* Software Requirements */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Software Requirements:
                </h2>
                <p className="text-lg text-foreground/90 leading-relaxed">
                  The application requires a modern web browser such as Chrome, Firefox, Safari, or Edge (latest version recommended). Users need a stable broadband internet connection for file uploads and IPFS integration. JavaScript must be enabled in the browser for full application functionality. For development purposes, Node.js 18+ and npm are required for local development and deployment.
                </p>
              </div>

              {/* Hardware Requirements */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Hardware Requirements:
                </h2>
                <p className="text-lg text-foreground/90 leading-relaxed">
                  The system can be accessed from any computer, tablet, or smartphone with at least 2GB of RAM. A minimum of 100MB free storage space is needed for browser cache and temporary files. The display should support a minimum screen resolution of 1024x768, though the responsive design adapts to all screen sizes. A network connection with at least 1 Mbps download and upload speed is recommended for optimal file transfer performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
