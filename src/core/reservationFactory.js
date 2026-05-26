function createFallbackUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const nextValue = char === "x" ? value : (value & 0x3) | 0x8;
    return nextValue.toString(16);
  });
}

function createReservationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return createFallbackUuid();
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
