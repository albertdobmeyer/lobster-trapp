"""Anthropic budget tracker — hard-stops the test session if cumulative spend
crosses a cap. Protects the user's $5 top-up from a runaway test.

Prices are per-million-tokens. Stored as Decimal for exact arithmetic; we work
in whole cents only when displaying.
"""
from __future__ import annotations

from decimal import Decimal
from typing import ClassVar


# Model → (input $/M tokens, output $/M tokens). Source: Anthropic pricing page.
# Add new models here as they become relevant.
MODEL_PRICES: dict[str, tuple[Decimal, Decimal]] = {
    "claude-haiku-4-5": (Decimal("1.00"), Decimal("5.00")),
    "claude-haiku-4-5-20251001": (Decimal("1.00"), Decimal("5.00")),
    "claude-sonnet-4-6": (Decimal("3.00"), Decimal("15.00")),
    "claude-opus-4-7": (Decimal("15.00"), Decimal("75.00")),
}


class BudgetExceeded(RuntimeError):
    pass


class BudgetTracker:
    HARD_STOP_USD: ClassVar[Decimal] = Decimal("4.00")  # stops well short of $5
    SOFT_WARN_USD: ClassVar[Decimal] = Decimal("1.00")

    def __init__(self) -> None:
        self.total: Decimal = Decimal("0")
        self.by_model: dict[str, Decimal] = {}
        self.call_count: int = 0

    def record(self, model: str, input_tokens: int, output_tokens: int) -> Decimal:
        prices = MODEL_PRICES.get(model)
        if prices is None:
            # Conservative fallback: price at the most expensive known model so
            # we never under-report. Log the unknown model for later fix.
            prices = max(MODEL_PRICES.values(), key=sum)
            print(f"[budget] unknown model {model!r}, falling back to worst-case pricing")
        input_cost = (Decimal(input_tokens) / Decimal(1_000_000)) * prices[0]
        output_cost = (Decimal(output_tokens) / Decimal(1_000_000)) * prices[1]
        call_cost = input_cost + output_cost
        self.total += call_cost
        self.by_model[model] = self.by_model.get(model, Decimal("0")) + call_cost
        self.call_count += 1

        if self.total > self.HARD_STOP_USD:
            raise BudgetExceeded(
                f"Cumulative spend ${self.total:.4f} exceeded hard stop "
                f"${self.HARD_STOP_USD:.2f}. Stopping session."
            )
        if self.total > self.SOFT_WARN_USD:
            print(f"[budget] warning: cumulative ${self.total:.4f} past soft threshold")
        return call_cost

    def summary(self) -> str:
        lines = [f"Budget summary — {self.call_count} calls, ${self.total:.4f} total"]
        for model, cost in sorted(self.by_model.items(), key=lambda kv: -kv[1]):
            lines.append(f"  {model}: ${cost:.4f}")
        return "\n".join(lines)
