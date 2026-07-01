import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, LayoutGrid, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { devLog } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    devLog.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0.2 
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-6"
      >
        {/* Glassmorphism card */}
        <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 md:p-12 shadow-2xl shadow-purple-500/10">
          {/* 404 Number with gradient */}
          <motion.h1 
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            404
          </motion.h1>
          
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
            Page Not Found
          </h2>
          
          {/* Description */}
          <p className="text-white/60 max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
            >
              <Link to="/hub">
                <Home className="h-4 w-4 mr-2" />
                Return to Hub
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
            >
              <Link to="/hub">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Product Hub
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        
        {/* Attempted path display */}
        <p className="text-white/30 text-sm mt-6">
          Attempted: <code className="text-cyan-400/50">{location.pathname}</code>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
