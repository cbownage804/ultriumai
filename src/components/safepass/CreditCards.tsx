import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { encryptData as cryptoEncrypt, decryptData as cryptoDecrypt, EncryptedData, AADContext } from '@/utils/crypto';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard as CreditCardIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Star,
  Copy,
  Loader2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface StoredCard {
  id: string;
  holder_name: string;
  last_four: string;
  card_type: string;
  encrypted_data: string;
  is_favorite: boolean;
  created_at: string;
}

interface DecryptedCard {
  id: string;
  holderName: string;
  lastFour: string;
  cardType: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  zip: string;
  is_favorite: boolean;
  created_at: string;
}

export const CreditCards = () => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [cards, setCards] = useState<DecryptedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DecryptedCard | null>(null);
  const [showCardDetails, setShowCardDetails] = useState<Record<string, boolean>>({});
  const [newCard, setNewCard] = useState({
    holderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    zip: '',
    cardType: 'credit'
  });

  // Use centralized crypto utilities with AAD support
  const encryptCardData = async (data: object, cardId?: string): Promise<string> => {
    if (!masterPassword || !user) throw new Error('Master password and user required');
    
    const aadContext: AADContext = {
      userId: user.id,
      entryId: cardId,
    };
    
    const encrypted = await cryptoEncrypt(JSON.stringify(data), masterPassword, undefined, aadContext);
    return JSON.stringify(encrypted);
  };

  const decryptCardData = async (encryptedData: string, cardId?: string): Promise<any> => {
    if (!masterPassword || !user) throw new Error('Master password and user required');
    
    const aadContext: AADContext = {
      userId: user.id,
      entryId: cardId,
    };
    
    // Parse the encrypted data (handle both old and new formats)
    const parsed = JSON.parse(encryptedData);
    
    // Check if it's the new EncryptedData format (has ciphertext) or old format
    if (parsed.ciphertext) {
      const decrypted = await cryptoDecrypt(parsed as EncryptedData, masterPassword, parsed.aad ? undefined : aadContext);
      return JSON.parse(decrypted);
    } else {
      // Legacy format with iv, salt, ciphertext (base64 encoded)
      // Convert to new format for decryption
      const legacyData: EncryptedData = {
        ciphertext: parsed.ciphertext || '',
        iv: parsed.iv || '',
        salt: parsed.salt || '',
        tag: '', // Legacy format doesn't have separate tag
      };
      const decrypted = await cryptoDecrypt(legacyData, masterPassword);
      return JSON.parse(decrypted);
    }
  };

  // Load and decrypt cards
  useEffect(() => {
    const loadCards = async () => {
      if (!user || !isUnlocked) {
        setCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safepass_cards')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const decrypted: DecryptedCard[] = [];
        for (const card of data || []) {
          try {
            const cardData = await decryptCardData(card.encrypted_data, card.id);
            decrypted.push({
              id: card.id,
              holderName: card.holder_name,
              lastFour: card.last_four,
              cardType: card.card_type,
              cardNumber: cardData.number || '',
              expiry: cardData.expiry || '',
              cvv: cardData.cvv || '',
              zip: cardData.zip || '',
              is_favorite: card.is_favorite,
              created_at: card.created_at
            });
          } catch {
            console.error('Failed to decrypt card');
          }
        }
        setCards(decrypted);
      } catch (error) {
        console.error('Error loading cards:', error);
        toast.error('Failed to load cards');
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [user, isUnlocked, masterPassword]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSaveCard = async () => {
    if (!newCard.holderName || !newCard.cardNumber || !newCard.expiry) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const cardData = {
        number: newCard.cardNumber.replace(/\s/g, ''),
        expiry: newCard.expiry,
        cvv: newCard.cvv,
        zip: newCard.zip
      };
      const encryptedData = await encryptCardData(cardData, editingCard?.id);
      const lastFour = newCard.cardNumber.replace(/\s/g, '').slice(-4);

      if (editingCard) {
        const { error } = await supabase
          .from('safepass_cards')
          .update({
            holder_name: newCard.holderName,
            last_four: lastFour,
            card_type: newCard.cardType,
            encrypted_data: encryptedData
          })
          .eq('id', editingCard.id);

        if (error) throw error;
        
        setCards(prev => prev.map(c => 
          c.id === editingCard.id 
            ? { 
                ...c, 
                holderName: newCard.holderName, 
                lastFour: lastFour,
                cardType: newCard.cardType,
                cardNumber: cardData.number,
                expiry: cardData.expiry,
                cvv: cardData.cvv,
                zip: cardData.zip
              }
            : c
        ));
        toast.success('Card updated successfully');
      } else {
        const { data, error } = await supabase
          .from('safepass_cards')
          .insert({
            user_id: user?.id,
            holder_name: newCard.holderName,
            last_four: lastFour,
            card_type: newCard.cardType,
            encrypted_data: encryptedData
          })
          .select()
          .single();

        if (error) throw error;

        setCards(prev => [{
          id: data.id,
          holderName: newCard.holderName,
          lastFour: lastFour,
          cardType: newCard.cardType,
          cardNumber: cardData.number,
          expiry: cardData.expiry,
          cvv: cardData.cvv,
          zip: cardData.zip,
          is_favorite: false,
          created_at: data.created_at
        }, ...prev]);
        toast.success('Card added successfully');
      }

      setIsAddDialogOpen(false);
      setEditingCard(null);
      setNewCard({ holderName: '', cardNumber: '', expiry: '', cvv: '', zip: '', cardType: 'credit' });
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const { error } = await supabase
        .from('safepass_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success('Card deleted');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  const toggleFavorite = async (card: DecryptedCard) => {
    try {
      const { error } = await supabase
        .from('safepass_cards')
        .update({ is_favorite: !card.is_favorite })
        .eq('id', card.id);

      if (error) throw error;

      setCards(prev => prev.map(c => 
        c.id === card.id ? { ...c, is_favorite: !c.is_favorite } : c
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const getCardBrand = (number: string) => {
    const n = number.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    return 'Card';
  };

  const filteredCards = cards.filter(card =>
    card.holderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.lastFour.includes(searchTerm)
  );

  if (!isUnlocked) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
        <p className="text-muted-foreground">Unlock your vault to view cards</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Payment Cards
          </h3>
          <p className="text-muted-foreground text-sm">Securely store your payment cards</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-black" onClick={() => {
              setEditingCard(null);
              setNewCard({ holderName: '', cardNumber: '', expiry: '', cvv: '', zip: '', cardType: 'credit' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Edit Card' : 'Add Payment Card'}</DialogTitle>
              <DialogDescription>Your card details will be encrypted</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-holder">Cardholder Name *</Label>
                <Input
                  id="card-holder"
                  value={newCard.holderName}
                  onChange={(e) => setNewCard(prev => ({ ...prev, holderName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <Label htmlFor="card-number">Card Number *</Label>
                <Input
                  id="card-number"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-expiry">Expiry *</Label>
                  <Input
                    id="card-expiry"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="card-cvv">CVV</Label>
                  <Input
                    id="card-cvv"
                    type="password"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-zip">Billing ZIP</Label>
                  <Input
                    id="card-zip"
                    value={newCard.zip}
                    onChange={(e) => setNewCard(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="12345"
                  />
                </div>
                <div>
                  <Label htmlFor="card-type">Type</Label>
                  <Select
                    value={newCard.cardType}
                    onValueChange={(value) => setNewCard(prev => ({ ...prev, cardType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveCard} className="flex-1 bg-primary hover:bg-primary text-black">
                  {editingCard ? 'Update' : 'Save'} Card
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCards.length === 0 ? (
        <Card className="p-10 text-center">
          <CreditCardIcon className="h-12 w-12 mx-auto mb-4 text-violet-400/70" />
          <h3 className="text-lg font-semibold mb-2">Let me autofill your cards at checkout</h3>
          <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
            Save a card once and I'll fill it in wherever you shop — no more digging through your wallet. Numbers are encrypted the moment you hit save.
          </p>
          <Button className="bg-primary hover:bg-primary text-black" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first card
          </Button>
        </Card>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredCards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="overflow-hidden group">
                  {/* Card Visual */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 relative">
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => toggleFavorite(card)}
                      >
                        <Star className={`h-4 w-4 ${card.is_favorite ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                    </div>
                    
                    <div className="text-xs uppercase tracking-wider opacity-70 mb-4">
                      {getCardBrand(card.cardNumber)} • {card.cardType}
                    </div>
                    
                    <div className="font-mono text-xl tracking-wider mb-4">
                      {showCardDetails[card.id] 
                        ? card.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                        : `•••• •••• •••• ${card.lastFour}`
                      }
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-70">CARDHOLDER</div>
                        <div className="text-sm uppercase">{card.holderName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-70">EXPIRES</div>
                        <div className="text-sm">
                          {showCardDetails[card.id] ? card.expiry : '••/••'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCardDetails(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                      >
                        {showCardDetails[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="ml-1 text-xs">{showCardDetails[card.id] ? 'Hide' : 'Show'}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(card.cardNumber, 'Card number')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCard(card);
                          setNewCard({
                            holderName: card.holderName,
                            cardNumber: card.cardNumber,
                            expiry: card.expiry,
                            cvv: card.cvv,
                            zip: card.zip,
                            cardType: card.cardType
                          });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
