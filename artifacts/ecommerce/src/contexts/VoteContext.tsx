import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [polls, setPolls] = useState<Poll[]>(() => {
    const saved = localStorage.getItem("cynmatic_polls");
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        title: "Siapa Admin terbaik bulan ini?",
        options: [
          { id: "opt1", text: "Zaidan", votes: 0 },
          { id: "opt2", text: "Pino", votes: 0 },
          { id: "opt3", text: "Admin AI", votes: 0 }
        ],
        isActive: true,
        votedUserIds: [],
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("cynmatic_polls", JSON.stringify(polls));
  }, [polls]);

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
  };

  const vote = (pollId: string, optionId: string, userId: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id !== pollId || poll.votedUserIds.includes(userId)) return poll;
      
      return {
        ...poll,
        votedUserIds: [...poll.votedUserIds, userId],
        options: poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        )
      };
    }));
  };

  const deletePoll = (pollId: string) => {
    setPolls(prev => prev.filter(p => p.id !== pollId));
  };

  const togglePollStatus = (pollId: string) => {
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isActive: !p.isActive } : p));
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
