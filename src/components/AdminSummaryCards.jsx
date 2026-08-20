import React from "react";
import { formatCurrency, formatPeopleCount } from "../core/formatters.js";

const CURRENCY_CARD_KEYS = new Set(["totalAmount", "pendingAmount"]);
const PEOPLE_CARD_KEYS = new Set(["totalPeople"]);

function formatCardValue(card = {}) {
  if (CURRENCY_CARD_KEYS.has(card.key)) {
    return formatCurrency(card.value || 0);
  }

  if (PEOPLE_CARD_KEYS.has(card.key)) {
    return formatPeopleCount(card.value || 0);
  }

  return Number(card.value || 0).toLocaleString("ko-KR");
}

export default function AdminSummaryCards({ cards = [] }) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="min-w-0 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-black text-stone-500">{card.label}</p>
          <p className="mt-2 break-all text-xl font-black text-stone-950 md:text-2xl">
            {formatCardValue(card)}
          </p>
        </div>
      ))}
    </div>
  );
}
