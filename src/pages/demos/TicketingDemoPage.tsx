import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TicketingDemo from "@/components/demos/TicketingDemo";

const TicketingDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TicketingDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TicketingDemoPage;