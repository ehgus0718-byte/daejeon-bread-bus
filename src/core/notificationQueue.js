function createNotificationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSafeText(value) {
  return String(value || "").trim();
}

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  CANCELED: "canceled"
};

export function createNotificationQueueItem({
  reservationId = "",
  recipient = "",
  message = "",
  channel = "sms"
} = {}) {
  return {
    id: createNotificationId(),
    reservationId: toSafeText(reservationId),
    recipient: toSafeText(recipient),
    message: toSafeText(message),
    channel: toSafeText(channel) || "sms",
    status: NOTIFICATION_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    sentAt: null,
    failedAt: null,
    errorMessage: ""
  };
}

export function enqueueNotification({ queue = [], item } = {}) {
  if (!item) {
    return queue;
  }

  return [...queue, item];
}

export function markNotificationSent({ queue = [], notificationId } = {}) {
  return queue.map((item) => {
    if (item.id !== notificationId) {
      return item;
    }

    return {
      ...item,
      status: NOTIFICATION_STATUS.SENT,
      sentAt: new Date().toISOString(),
      failedAt: null,
      errorMessage: ""
    };
  });
}

export function markNotificationFailed({
  queue = [],
  notificationId,
  errorMessage = ""
} = {}) {
  return queue.map((item) => {
    if (item.id !== notificationId) {
      return item;
    }

    return {
      ...item,
      status: NOTIFICATION_STATUS.FAILED,
      failedAt: new Date().toISOString(),
      errorMessage: toSafeText(errorMessage)
    };
  });
}

export function getPendingNotifications(queue = []) {
  return queue.filter((item) => item.status === NOTIFICATION_STATUS.PENDING);
}
