import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Upload, Share2, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Requirements } from "@/components/Requirements";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  const features = [
    {
      icon: Lock,
      title: "Decentralized Storage",
      description: "Your files are stored securely on IPFS with blockchain verification",
    },
    {
      icon: Shield,
      title: "End-to-End Security",
      description: "Military-grade encryption ensures your data remains private",
    },
    {
      icon: Upload,
      title: "Easy Upload",
      description: "Drag and drop your files for instant decentralized storage",
    },
    {
      icon: Share2,
      title: "Secure Sharing",
      description: "Share files with cryptographic verification and access control",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by IPFS & Blockchain</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Decentralized File Storage for the Future
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Store, share, and verify your files with blockchain-backed security. 
              Your data, truly yours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose SecureVault?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the next generation of file storage with decentralized technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <Requirements />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
            <div className="relative p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Secure Your Files?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users protecting their data with decentralized storage
              </p>
              <Link to="/signup">
                <Button variant="hero" size="lg">
                  Start Your Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
