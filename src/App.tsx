import React, { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
};

const PRODUCTS: Product[] = [
  { id: "1", name: "Cosmic Headphones", price: 299, category: "Audio", image: "https://picsum.photos/seed/headphones/800/600" },
  { id: "2", name: "Nebula Speaker", price: 199, category: "Audio", image: "https://picsum.photos/seed/speaker/800/600" },
  { id: "3", name: "Starlight Keyboard", price: 149, category: "Accessories", image: "https://picsum.photos/seed/keyboard/800/600" },
];

export default function App() {
  const [cart, setCart] = useState<Record<string, number>>({});

  const items = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = PRODUCTS.find(x => x.id === id);
        return p ? { ...p, qty } : null;
      })
      .filter(Boolean) as (Product & { qty: number })[];
  }, [cart]);

  const total = useMemo(
    () => items.reduce((sum, p) => sum + p.price * p.qty, 0),
    [items]
  );

  const add = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart(prev => {
      const next = { ...prev };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  return (
    <div style={{ minHeight: "100vh", background: "#070712", color: "white", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Store</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {PRODUCTS.map(p => (
          <div key={p.id} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ height: 150, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.image ? (
                <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ opacity: 0.7 }}>No image</span>
              )}
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{p.name}</strong>
                <span>${p.price}</span>
              </div>
              <div style={{ opacity: 0.7, marginTop: 6 }}>{p.category}</div>

              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => remove(p.id)} style={{ padding: "6px 10px" }}>-</button>
                <span style={{ minWidth: 18, textAlign: "center" }}>{cart[p.id] ?? 0}</span>
                <button onClick={() => add(p.id)} style={{ padding: "6px 10px" }}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <strong>Cart total:</strong> ${total.toFixed(2)}
      </div>
    </div>
  );
}
