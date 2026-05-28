import React from "react";
import { useRoute } from "wouter";
import { UnifiedTicketInbox } from "../components/UnifiedTicketInbox";

export function TicketPage() {
  const [, params] = useRoute("/ticket/:id");
  return <UnifiedTicketInbox preSelectedTicketId={params?.id} />;
}

