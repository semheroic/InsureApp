import React, { createContext, useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";

import RealtimeChatSheet from "@/components/chat/RealtimeChatSheet";
import { Button } from "@/components/ui/button";

type ChatLauncherContextValue = {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const ChatLauncherContext = createContext<ChatLauncherContextValue | undefined>(undefined);

export const ChatLauncherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const value = useMemo<ChatLauncherContextValue>(
    () => ({
      isChatOpen,
      openChat: () => setIsChatOpen(true),
      closeChat: () => setIsChatOpen(false),
      toggleChat: () => setIsChatOpen(current => !current),
    }),
    [isChatOpen]
  );

  return (
    <ChatLauncherContext.Provider value={value}>
      {children}

      {!isChatOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.28 },
            scale: { duration: 0.28 },
            y: {
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="fixed bottom-4 right-4 z-[55] sm:bottom-5 sm:right-5 lg:bottom-8 lg:right-8"
        >
          <Button
            type="button"
            onClick={value.openChat}
            className="h-12 w-12 rounded-full bg-cyan-400 p-0 text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.35)] hover:bg-cyan-300 sm:h-14 sm:w-auto sm:px-5"
          >
            <MessageSquareText className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Live Chat</span>
          </Button>
        </motion.div>
      )}

      <RealtimeChatSheet open={isChatOpen} onOpenChange={setIsChatOpen} />
    </ChatLauncherContext.Provider>
  );
};

export const useChatLauncher = () => {
  const context = useContext(ChatLauncherContext);

  if (!context) {
    throw new Error("useChatLauncher must be used within ChatLauncherProvider");
  }

  return context;
};
