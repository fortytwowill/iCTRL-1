import { Navigate, useLocation } from "react-router-dom";
import { getAuthCallbackType } from "@/lib/authUrls";

export function AuthCallbackRedirector() {
  const location = useLocation();

  const shouldRedirectRecoveryCallback =
    getAuthCallbackType(location.hash) === "recovery" &&
    location.pathname !== "/login";

  if (shouldRedirectRecoveryCallback) {
    return (
      <Navigate
        to={{
          pathname: "/login",
          search: "?recovery=1",
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return null;
}
