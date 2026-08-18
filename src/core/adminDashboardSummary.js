import { getPendingNotifications } from "./notificationQueue.js";
import { calculateReservationStats } from "./reservationStats.js";
import {
  createScheduleSummaries,
  filterAvailableScheduleSummaries,
  filterOpenScheduleSummaries
} from "./scheduleSummary.js";

export function createAdminDashboardSummary({
  reservations = [],
  dateSettings = {},
  notificationQueue = []
} = {}) {
  const reservationStats = calculateReservationStats(reservations);
  const scheduleSummaries = createScheduleSummaries({
    dateSettings,
    reservations
  });
  const openSchedules = filterOpenScheduleSummaries(scheduleSummaries);
  const availableSchedules = filterAvailableScheduleSummaries(scheduleSummaries);
  const pendingNotifications = getPendingNotifications(notificationQueue);

  return {
    reservationStats,
    totalSchedules: scheduleSummaries.length,
    openScheduleCount: openSchedules.length,
    availableScheduleCount: availableSchedules.length,
    pendingNotificationCount: pendingNotifications.length,
    scheduleSummaries
  };
}

export function getAdminDashboardSummaryCards(summary = {}) {
  return [
    {
      key: "totalReservations",
      label: "전체 예약",
      value: summary.reservationStats?.totalReservations || 0
    },
    {
      key: "totalPeople",
      label: "실결제 인원",
      value: summary.reservationStats?.paidPeople || 0
    },
    {
      key: "totalAmount",
      label: "실결제 매출",
      value: summary.reservationStats?.paidAmount || 0
    },
    {
      key: "pendingAmount",
      label: "미결제 대기",
      value: summary.reservationStats?.pendingAmount || 0
    },
    {
      key: "availableSchedules",
      label: "예약 가능 일정",
      value: summary.availableScheduleCount || 0
    }
  ];
}
