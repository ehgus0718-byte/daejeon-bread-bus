import React from "react";
import { formatCurrency, formatPeopleCount } from "../core/formatters.js";

function formatCardValue(card = {}) {
  if (card.key === "totalAmount") {
    return formatCurrency(card.value || 0);
  }

  if (card.key === "totalPeople") {
    return formatPeopleCount(card.value || 0);
  }

  return Number(card.value || 0).toLocaleString("ko-KR");
}

export default function AdminSummaryCards({ cards = [] }) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-black text-stone-500">{card.label}</p>
          <p className="mt-2 text-2xl font-black text-stone-950">
            {formatCardValue(card)}
          </p>
        </div>
      ))}
    </div>
  );
}
