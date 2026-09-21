import { createServerFn } from "@tanstack/react-start";

import { getAnalytics } from "@/db/queries.server";

export const getAnalyticsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getAnalytics();
});
