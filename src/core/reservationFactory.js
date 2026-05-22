function createReservationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `reservation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createReservation({
  selectedDate,
  form = {},
  price = 0,
  status = "결제대기"
}) {
  const people = Number(form.people || 1);

  return {
    id: createReservationId(),
    date: selectedDate,
    name: form.name?.trim() || "",
    phone: form.phone?.trim() || "",
    people,
    amount: people * Number(price || 0),
    status,
    createdAt: new Date().toISOString()
  };
}
