/* What an owner can write to us about — kept short so a person on the
   ops side can see at a glance what kind of problem it is. */
export const TICKET_TOPICS = ["Something was missed", "Damage or something missing", "The inspector", "A bill", "Something else"] as const;
export type TicketTopic = (typeof TICKET_TOPICS)[number];
