import { createServerFn } from "@tanstack/react-start";

import { getDashboardData, listBatches, listPolicies, listTodos, toggleTodo } from "@/db/queries.server";

export const getDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  return getDashboardData();
});

export const toggleTodoFn = createServerFn({ method: "POST" })
  .validator((input: { id: number; done: boolean }) => input)
  .handler(async ({ data }) => {
    toggleTodo(data.id, data.done);
    return listTodos();
  });

export const getAssetsFn = createServerFn({ method: "GET" }).handler(async () => {
  return { batches: listBatches(), policies: listPolicies() };
});
