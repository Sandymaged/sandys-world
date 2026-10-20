import type { OrderRecord } from "./db/types";

/** رسايل العميل اللي المتجر لسه ما شافهاش */
export const unreadForStore = (o: Pick<OrderRecord, "messages" | "storeReadAt">) =>
  (o.messages ?? []).filter((m) => m.from === "customer" && (!o.storeReadAt || m.at > o.storeReadAt)).length;

/** رسايل المتجر اللي العميل لسه ما شافهاش */
export const unreadForCustomer = (o: Pick<OrderRecord, "messages" | "customerReadAt">) =>
  (o.messages ?? []).filter((m) => m.from === "store" && (!o.customerReadAt || m.at > o.customerReadAt)).length;

export const MAX_MESSAGE = 600;
export const MAX_MESSAGES_PER_ORDER = 200;
