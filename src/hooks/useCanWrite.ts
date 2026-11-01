import { useAuth } from "@/contexts/AuthContext";

export function useCanWrite() {
  const { isReadOnly } = useAuth();
  return { canWrite: !isReadOnly };
}