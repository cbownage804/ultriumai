import { ClientOnboardingFlow } from "@/components/msp/ClientOnboardingFlow";
import { useNavigate } from "react-router-dom";

const MSPOnboardingPage = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/msps");
  };

  return <ClientOnboardingFlow onComplete={handleComplete} />;
};

export default MSPOnboardingPage;