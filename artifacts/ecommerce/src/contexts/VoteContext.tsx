import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAllPollsFromVPS, syncPollToVPS } from "../lib/sync";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  isActive: boolean;
  votedUserIds: string[];
  createdAt: string;
}

interface VoteContextType {
  polls: Poll[];
  createPoll: (title: string, options: string[]) => void;
  vote: (pollId: string, optionId: string, userId: string) => void;
  deletePoll: (pollId: string) => void;
  togglePollStatus: (pollId: string) => void;
}

const VoteContext = createContext<VoteContextType | undefined>(undefined);

export const VoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [polls, setPolls] = useState<Poll[]>([]);

  // Initial Fetch from VPS
  useEffect(() => {
    const init = async () => {
      const vpsPolls = await fetchAllPollsFromVPS();
      if (vpsPolls) setPolls(vpsPolls);
    };
    init();
    // Poll every 30s
    const interval = setInterval(init, 30000);
    return () => clearInterval(interval);
  }, []);

  const createPoll = (title: string, optionTexts: string[]) => {
    const newPoll: Poll = {
      id: Date.now().toString(),
      title,
      options: optionTexts.map((text, i) => ({ id: `opt-${i}-${Date.now()}`, text, votes: 0 })),
      isActive: true,
      votedUserIds: [],
      createdAt: new Date().toISOString()
    };
    setPolls([newPoll, ...polls]);
    syncPollToVPS(newPoll);
  };

  const vote = (pollId: string, optionId: string, userId: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id !== pollId || poll.votedUserIds.includes(userId)) return poll;
      
      const updated = {
        ...poll,
        votedUserIds: [...poll.votedUserIds, userId],
        options: poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        )
      };
      syncPollToVPS(updated);
      return updated;
    }));
  };

  const deletePoll = (pollId: string) => {
    setPolls(prev => prev.filter(p => p.id !== pollId));
  };

  const togglePollStatus = (pollId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        const updated = { ...p, isActive: !p.isActive };
        syncPollToVPS(updated);
        return updated;
      }
      return p;
    }));
  };

  return (
    <VoteContext.Provider value={{ polls, createPoll, vote, deletePoll, togglePollStatus }}>
      {children}
    </VoteContext.Provider>
  );
};

export const useVote = () => {
  const context = useContext(VoteContext);
  if (!context) throw new Error("useVote must be used within a VoteProvider");
  return context;
};
