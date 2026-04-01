import { useCallback, useMemo, useState } from "react";

const DEFAULT_PERMISSIONS = {
  allow_user_ai: false,
  allow_user_captions: false,
  allow_guest_screen_share: false,
  allow_user_screen_share: false,
};

const normalizeRole = (role) => {
  const value = String(role || "").toLowerCase();
  if (value === "host" || value === "user" || value === "guest") return value;
  return "guest";
};

const normalizePermissions = (permissions) => ({
  allow_user_ai: Boolean(permissions?.allow_user_ai),
  allow_user_captions: Boolean(permissions?.allow_user_captions),
  allow_guest_screen_share: Boolean(permissions?.allow_guest_screen_share),
  allow_user_screen_share: Boolean(permissions?.allow_user_screen_share),
});

const samePermissions = (a, b) =>
  a.allow_user_ai === b.allow_user_ai &&
  a.allow_user_captions === b.allow_user_captions &&
  a.allow_guest_screen_share === b.allow_guest_screen_share &&
  a.allow_user_screen_share === b.allow_user_screen_share;

export default function useMeetingPermissions(initialRole = "guest", initialPermissions = {}) {
  const [permissionState, setPermissionState] = useState({
    role: normalizeRole(initialRole),
    permissions: normalizePermissions({ ...DEFAULT_PERMISSIONS, ...initialPermissions }),
  });

  const setRole = useCallback((role) => {
    const nextRole = normalizeRole(role);
    setPermissionState((prev) => {
      if (prev.role === nextRole) return prev;
      return { ...prev, role: nextRole };
    });
  }, []);

  const setPermissions = useCallback((permissions) => {
    setPermissionState((prev) => {
      const nextPermissions = normalizePermissions({ ...prev.permissions, ...permissions });
      if (samePermissions(prev.permissions, nextPermissions)) return prev;
      return {
        ...prev,
        permissions: nextPermissions,
      };
    });
  }, []);

  const applyPermissionUpdate = useCallback((payload) => {
    if (!payload) return;
    if (payload.role) setRole(payload.role);
    if (payload.permissions) {
      setPermissions(payload.permissions);
      return;
    }
    setPermissions(payload);
  }, [setPermissions, setRole]);

  const access = useMemo(() => {
    const { role, permissions } = permissionState;
    const isHost = role === "host";
    const isUser = role === "user";
    const isGuest = role === "guest";

    return {
      isHost,
      isUser,
      isGuest,
      canPrivateMessage: isHost || isUser,
      canGenerateAI: isHost || (isUser && permissions.allow_user_ai),
      canUseCaptions: isHost || (isUser && permissions.allow_user_captions),
      canScreenShare:
        isHost ||
        (isUser && permissions.allow_user_screen_share) ||
        (isGuest && permissions.allow_guest_screen_share),
      canAdminControl: isHost,
    };
  }, [permissionState]);

  return {
    permissionState,
    setRole,
    setPermissions,
    applyPermissionUpdate,
    ...access,
  };
}
