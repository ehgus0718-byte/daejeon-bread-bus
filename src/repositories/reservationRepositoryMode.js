const REPOSITORY_MODE = {
  LOCAL: "local",
  API: "api"
};

function getConfiguredMode() {
  return import.meta?.env?.VITE_RESERVATION_REPOSITORY_MODE || REPOSITORY_MODE.LOCAL;
}

export function getReservationRepositoryMode() {
  const configuredMode = getConfiguredMode();

  if (configuredMode === REPOSITORY_MODE.API) {
    return REPOSITORY_MODE.API;
  }

  return REPOSITORY_MODE.LOCAL;
}

export function shouldUseReservationApi() {
  return getReservationRepositoryMode() === REPOSITORY_MODE.API;
}

export function shouldUseLocalReservationStorage() {
  return getReservationRepositoryMode() === REPOSITORY_MODE.LOCAL;
}

export { REPOSITORY_MODE };
