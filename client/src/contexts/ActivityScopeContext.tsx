import React, { createContext, useContext, useState, useCallback } from "react";

type ActivityScope = "mine" | "all";

interface ActivityScopeContextType {
  activityScope: ActivityScope;
  setActivityScope: (scope: ActivityScope, isAdmin?: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

const ActivityScopeContext = createContext<ActivityScopeContextType | undefined>(undefined);

export const ActivityScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activityScope, setActivityScopeState] = useState<ActivityScope>("mine");
  const [isAdmin, setIsAdmin] = useState(false);

  const setActivityScope = useCallback((scope: ActivityScope, userIsAdmin = isAdmin) => {
    // Only allow "all" scope for admin users
    if (scope === "all" && !userIsAdmin) {
      console.warn("Non-admin users cannot access 'all' activity scope");
      return;
    }
    setActivityScopeState(scope);
  }, [isAdmin]);

  return (
    <ActivityScopeContext.Provider value={{ activityScope, setActivityScope, isAdmin, setIsAdmin }}>
      {children}
    </ActivityScopeContext.Provider>
  );
};

export const useActivityScope = () => {
  const context = useContext(ActivityScopeContext);
  if (!context) {
    throw new Error("useActivityScope must be used within ActivityScopeProvider");
  }
  return context;
};
