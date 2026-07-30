import { useAuth } from './useAuth';

export const usePermission = () => {
  const { hasPermission } = useAuth();
  return { can: hasPermission };
};
