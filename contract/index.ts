// Hub ⇄ backend contract — single source of truth (PLAN.md Bước 4B). Docs: docs/contract/README.md.
// Draft v0: breaking changes are still allowed until v1; log every change in docs/contract/README.md §5.
export const CONTRACT_VERSION = "0.1.0";

export * from "./common";
export * from "./limits";
export * from "./errors";
export * from "./auth";
export * from "./chat";
export * from "./social";
export * from "./lobby";
export * from "./room";
export * from "./match";
export * from "./tournament";
export * from "./clan";
export * from "./player";
export * from "./home";
export * from "./api";
export * from "./transport";
