 import { Loader2, CheckCircle2 } from 'lucide-react';
 import { useEffect, useState } from 'react';
 
 interface AuthLoadingScreenProps {
   message?: string;
   showProgress?: boolean;
 }
 
 export function AuthLoadingScreen({ 
   message = "Loading...", 
   showProgress = false 
 }: AuthLoadingScreenProps) {
   const [progress, setProgress] = useState(0);
   const [step, setStep] = useState(0);
 
   const steps = [
     { label: "Verifying credentials", delay: 0 },
     { label: "Restoring session", delay: 800 },
     { label: "Loading your dashboard", delay: 1600 },
   ];
 
   useEffect(() => {
     if (!showProgress) return;
 
     const progressInterval = setInterval(() => {
       setProgress(prev => {
         if (prev >= 90) return prev;
         return prev + Math.random() * 15;
       });
     }, 300);
 
     const stepTimers = steps.map((_, index) => 
       setTimeout(() => setStep(index), steps[index].delay)
     );
 
     return () => {
       clearInterval(progressInterval);
       stepTimers.forEach(timer => clearTimeout(timer));
     };
   }, [showProgress]);
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
       <div className="w-full max-w-md px-6">
         <div className="text-center space-y-6">
           <div className="relative mx-auto w-20 h-20">
             <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
             <div className="relative flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full border border-primary/20">
               <Loader2 className="h-10 w-10 text-primary animate-spin" />
             </div>
           </div>
 
           <div className="space-y-2">
             <h2 className="text-xl font-semibold text-foreground">
               {message}
             </h2>
             <p className="text-sm text-muted-foreground">
               This will only take a moment
             </p>
           </div>
 
           {showProgress && (
             <div className="space-y-3 pt-4">
               {steps.map((stepData, index) => {
                 const isActive = step >= index;
                 const isComplete = step > index;
 
                 return (
                   <div 
                     key={index}
                     className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                       isActive ? 'text-foreground' : 'text-muted-foreground/50'
                     }`}
                   >
                     <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                       isComplete 
                         ? 'border-primary bg-primary' 
                         : isActive 
                         ? 'border-primary' 
                         : 'border-muted-foreground/30'
                     }`}>
                       {isComplete ? (
                         <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                       ) : isActive ? (
                         <Loader2 className="h-3 w-3 text-primary animate-spin" />
                       ) : null}
                     </div>
                     <span className={isActive ? 'font-medium' : ''}>
                       {stepData.label}
                     </span>
                   </div>
                 );
               })}
             </div>
           )}
 
           {showProgress && (
             <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-300 ease-out"
                 style={{ width: `${progress}%` }}
               />
             </div>
           )}
 
           <p className="text-xs text-muted-foreground pt-4">
             Having trouble? Try refreshing the page or{' '}
             <button 
               onClick={() => window.location.href = '/auth'}
               className="text-primary hover:underline"
             >
               sign in again
             </button>
           </p>
         </div>
       </div>
     </div>
   );
 }