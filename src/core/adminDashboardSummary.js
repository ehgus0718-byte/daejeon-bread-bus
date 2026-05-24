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
      label: "전체 인원",
      value: summary.reservationStats?.totalPeople || 0
    },
    {
      key: "totalAmount",
      label: "예상 매출",
      value: summary.reservationStats?.totalAmount || 0
    },
    {
      key: "availableSchedules",
      label: "예약 가능 일정",
      value: summary.availableScheduleCount || 0
    },
    {
      key: "pendingNotifications",
      label: "발송 대기 알림",
      value: summary.pendingNotificationCount || 0
    }
  ];
}
