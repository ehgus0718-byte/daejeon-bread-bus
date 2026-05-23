export function updateCapacityOverride({
  capacityOverrides = {},
  date,
  nextCapacity
}) {
  return {
    ...capacityOverrides,
    [date]: Math.max(1, Number(nextCapacity || 1))
  };
}

export function updatePriceOverride({
  priceOverrides = {},
  date,
  nextPrice
}) {
  return {
    ...priceOverrides,
    [date]: Math.max(0, Number(nextPrice || 0))
  };
}

export function updateScheduleStatus({
  scheduleStatus = {},
  date,
  nextStatus
}) {
  return {
    ...scheduleStatus,
    [date]: nextStatus
  };
}
