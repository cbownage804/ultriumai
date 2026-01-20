import { SecureNotes } from '@/components/safepass/SecureNotes';

const SafePassNotes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Secure Notes</h1>
        <p className="text-muted-foreground">Store encrypted notes, documents, and sensitive information securely.</p>
      </div>
      <SecureNotes />
    </div>
  );
};

export default SafePassNotes;
