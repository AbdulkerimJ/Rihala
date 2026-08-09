/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { getApiBaseUrl, setupInterceptors } from "../api/axios";
import { parseJwt } from "../utils/jwt";
import { login as loginApi, logout as logoutApi } from "../features/auth/api";
import { getUserById } from "../features/users/api";

export const AuthContext = createContext({
  currentUser: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  loginWithToken: async () => {},
  logout: async () => {},
  hasPermission: () => false,
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenRef = useRef(null);

  const setAccessToken = useCallback((token) => {
    tokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const getAccessToken = useCallback(() => tokenRef.current, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      setAccessToken(null);
    }
  }, [setAccessToken]);

  useEffect(() => {
    setupInterceptors(getAccessToken, setAccessToken, handleLogout);
  }, [getAccessToken, setAccessToken, handleLogout]);

  const loadUser = useCallback(
    async (token) => {
      try {
        const payload = parseJwt(token);
        if (payload && payload.id) {
          const res = await getUserById(payload.id);
          setCurrentUser(res.data);
        }
      } catch (error) {
        console.error("Failed to load user info:", error);
        setCurrentUser(null);
        setAccessToken(null);
      }
    },
    [setAccessToken],
  );

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${getApiBaseUrl()}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const token = res.data.data.accessToken;
      setAccessToken(token);
      await loadUser(token);
    } catch (error) {
      // Refresh failed, probably no valid session
      console.log("No valid session found on startup");
    } finally {
      setIsLoading(false);
    }
  }, [setAccessToken, loadUser]);

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const token = res.data.accessToken;
    setAccessToken(token);
    await loadUser(token);
  };

  const loginWithToken = async (token) => {
    setAccessToken(token);
    await loadUser(token);
  };

  const hasPermission = useCallback(
    (permissionName) => {
      if (!currentUser) return false;
      return currentUser.roles?.some((role) =>
        role.permissions?.some((perm) => perm.name === permissionName),
      );
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      currentUser,
      accessToken,
      isAuthenticated: !!currentUser && !!accessToken,
      isLoading,
      login,
      loginWithToken,
      logout: handleLogout,
      hasPermission,
    }),
    [currentUser, accessToken, isLoading, hasPermission, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
