export const INITIAL_RESERVATIONS = [
  {
    id: "r1",
    date: "2026-05-30",
    name: "김민수",
    people: 8,
    status: "결제완료",
    createdAt: "2026-05-21T09:00:00"
  },
  {
    id: "r2",
    date: "2026-06-06",
    name: "이서연",
    people: 13,
    status: "예약확정",
    createdAt: "2026-05-21T10:00:00"
  }
];

export const INITIAL_CAPACITY_OVERRIDES = {
  "2026-05-30": 15,
  "2026-06-06": 20
};

export const INITIAL_PRICE_OVERRIDES = {
  "2026-05-30": 30000,
  "2026-06-06": 35000
};

export const INITIAL_SCHEDULE_STATUS = {
  "2026-05-30": "open",
  "2026-06-06": "open"
};

export const INITIAL_ADMIN_SETTINGS = {
  capacityOverrides: INITIAL_CAPACITY_OVERRIDES,
  priceOverrides: INITIAL_PRICE_OVERRIDES,
  scheduleStatus: INITIAL_SCHEDULE_STATUS
};
