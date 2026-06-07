'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { ProcedurePriceDisplay } from '@/components/ProcedurePriceDisplay';
import { fromLeiToStored, toLei } from '@/lib/procedure-currency';
import { useEurToRonRate } from '@/hooks/useEurToRonRate';

interface ProcedurePriceRow {
  codeId: string;
  code: string;
  description: string;
  category: string;
  currency: string;
  catalogPrice: number | null;
  userPrice: number | null;
  effectivePrice: number;
}

export default function ProcedurePriceSettings() {
  const [rows, setRows] = useState<ProcedurePriceRow[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const rate = useEurToRonRate();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/users/me/procedure-prices');
        if (!response.ok) throw new Error('Nu s-au putut încărca datele');
        const data: ProcedurePriceRow[] = await response.json();
        setRows(data);
        const drafts: Record<string, string> = {};
        for (const row of data) {
          if (row.userPrice !== null) {
            const lei = Math.round(toLei(row.userPrice, row.currency, rate));
            drafts[row.codeId] = String(lei);
          } else {
            drafts[row.codeId] = '';
          }
        }
        setDraftPrices(drafts);
      } catch {
        toast({
          title: 'Eroare',
          description: 'Nu s-au putut încărca prețurile procedurilor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const prices = rows.map((row) => {
        const raw = draftPrices[row.codeId]?.trim();
        if (!raw) {
          return { codeId: row.codeId, price: null };
        }
        const leiParsed = parseFloat(raw);
        if (isNaN(leiParsed) || leiParsed < 0) {
          throw new Error(`Preț invalid pentru ${row.code}`);
        }
        const stored = fromLeiToStored(leiParsed, row.currency, rate);
        return { codeId: row.codeId, price: stored };
      });

      const response = await fetch('/api/users/me/procedure-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices }),
      });

      if (!response.ok) throw new Error('Nu s-au putut salva datele');

      toast({
        title: 'Salvat',
        description: 'Prețurile implicite ale procedurilor au fost actualizate.',
      });

      const refresh = await fetch('/api/users/me/procedure-prices');
      if (refresh.ok) {
        const data = await refresh.json();
        setRows(data);
      }
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-au putut salva prețurile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Se încarcă prețurile procedurilor...</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nu există coduri de proceduri în catalog. Rulați seed-ul pentru proceduri chirurgicale pentru a adăuga coduri.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Setați prețul implicit pentru fiecare procedură în lei. Lăsați gol pentru a folosi prețul din catalogul clinicii.
        Treceți cursorul peste prețurile din catalog pentru a vedea echivalentul în euro. Puteți ajusta prețul la adăugarea unei
        proceduri pentru un pacient.
      </p>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 border-b">
          <span>Procedură</span>
          <span className="text-right">Catalog</span>
          <span className="text-right">Prețul dvs. (lei)</span>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {rows.map((row) => (
            <div
              key={row.codeId}
              className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-2 items-center text-sm"
            >
              <div>
                <div className="font-medium">{row.code}</div>
                <div className="text-xs text-gray-500 truncate">{row.description}</div>
              </div>
              <div className="text-right text-gray-500">
                {row.catalogPrice != null ? (
                  <ProcedurePriceDisplay
                    amount={row.catalogPrice}
                    currency={row.currency}
                    rate={rate}
                    className="text-sm"
                  />
                ) : (
                  '—'
                )}
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="h-8 text-right"
                  placeholder={
                    row.catalogPrice != null
                      ? String(Math.round(toLei(row.catalogPrice, row.currency, rate)))
                      : '0'
                  }
                  value={draftPrices[row.codeId] ?? ''}
                  onChange={(e) =>
                    setDraftPrices((prev) => ({
                      ...prev,
                      [row.codeId]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Se salvează...' : 'Salvează prețurile implicite'}
      </Button>
    </div>
  );
}
