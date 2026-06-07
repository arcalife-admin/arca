'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  formatEur,
  formatLei,
  toEur,
  toLei,
  type ProcedureCurrency,
} from '@/lib/procedure-currency';
import { useEurToRonRate } from '@/hooks/useEurToRonRate';
import { cn } from '@/lib/utils';

interface ProcedurePriceDisplayProps {
  amount: number | null | undefined;
  currency?: ProcedureCurrency | string;
  rate?: number;
  className?: string;
  approximateEur?: boolean;
}

export function ProcedurePriceDisplay({
  amount,
  currency = 'EUR',
  rate: rateProp,
  className,
  approximateEur,
}: ProcedurePriceDisplayProps) {
  const fetchedRate = useEurToRonRate();
  const rate = rateProp ?? fetchedRate;

  if (amount == null || Number.isNaN(amount)) {
    return <span className={className}>—</span>;
  }

  const leiAmount = toLei(amount, currency, rate);
  const eurAmount = toEur(amount, currency, rate);
  const showApproximate = approximateEur ?? currency === 'RON';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'cursor-default underline decoration-dotted underline-offset-2',
              className
            )}
          >
            {formatLei(leiAmount)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{formatEur(eurAmount, showApproximate)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
