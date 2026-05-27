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

function toCount(value, fallbackValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.floor(numberValue)) : fallbackValue;
}

function createPassengerSummary({ adultCount = 0, childCount = 0, infantCount = 0 }) {
  return `성인 ${adultCount}명 / 아동 ${childCount}명 / 유아 ${infantCount}명`;
}

export function createReservation({
  selectedDate,
  form = {},
  price = 0,
  status = "결제대기"
}) {
  const adultCount = toCount(form.adultCount, 1);
  const childCount = toCount(form.childCount, 0);
  const infantCount = toCount(form.infantCount, 0);
  const hasPassengerCounts =
    form.adultCount !== undefined ||
    form.childCount !== undefined ||
    form.infantCount !== undefined;
  const people = hasPassengerCounts
    ? adultCount + childCount + infantCount
    : toCount(form.people, 1);
  const adultPrice = Number(price || 0);
  const childPrice = Math.max(0, adultPrice - 10000);
  const amount = hasPassengerCounts
    ? adultCount * adultPrice + childCount * childPrice
    : people * adultPrice;
  const passengerSummary = hasPassengerCounts
    ? createPassengerSummary({ adultCount, childCount, infantCount })
    : "";

  return {
    id: createReservationId(),
    date: selectedDate,
    name: form.name?.trim() || "",
    phone: form.phone?.trim() || "",
    people,
    amount,
    status,
    adminNote: passengerSummary,
    createdAt: new Date().toISOString()
  };
}
