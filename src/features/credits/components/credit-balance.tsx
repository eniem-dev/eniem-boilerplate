import type { CreditBalance as CreditBalanceType } from "../models/credits.model";

interface CreditBalanceProps {
  balance: CreditBalanceType | null;
  className?: string;
}

export function CreditBalance({ balance, className }: CreditBalanceProps) {
  if (!balance) {
    return null;
  }

  return (
    <span className={className}>
      {balance.balance} credits
    </span>
  );
}
