import { useEffect, useMemo, useState } from "react";
import {
  loadAppPersistence,
  saveAppAdminSettings,
  saveAppReservations
} from "../services/appPersistence.js";

export function useAppPersistence({
  initialReservations = [],
  initialAdminSettings = {}
} = {}) {
  const initialData = useMemo(
    () =>
      loadAppPersistence({
        fallbackReservations: initialReservations,
        fallbackAdminSettings: initialAdminSettings
      }),
    [initialAdminSettings, initialReservations]
  );

  const [reservations, setReservations] = useState(initialData.reservations);
  const [capacityOverrides, setCapacityOverrides] = useState(
    initialData.adminSettings.capacityOverrides || {}
  );
  const [priceOverrides, setPriceOverrides] = useState(
    initialData.adminSettings.priceOverrides || {}
  );
  const [scheduleStatus, setScheduleStatus] = useState(
    initialData.adminSettings.scheduleStatus || {}
  );

  useEffect(() => {
    saveAppReservations(reservations);
  }, [reservations]);

  useEffect(() => {
    saveAppAdminSettings({
      capacityOverrides,
      priceOverrides,
      scheduleStatus
    });
  }, [capacityOverrides, priceOverrides, scheduleStatus]);

  return {
    reservations,
    setReservations,
    capacityOverrides,
    setCapacityOverrides,
    priceOverrides,
    setPriceOverrides,
    scheduleStatus,
    setScheduleStatus
  };
}
