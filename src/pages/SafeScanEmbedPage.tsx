import { SafeScanApp } from "@/components/apps/SafeScanApp";

const SafeScanEmbedPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SafeScanApp isWhiteLabeled={true} brandName="MSP Security" />
    </div>
  );
};

export default SafeScanEmbedPage;