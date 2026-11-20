export type CrmResult = {
  status: "sent" | "skipped" | "failed";
  error?: string;
};
