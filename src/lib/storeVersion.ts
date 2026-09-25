/** The shape version of the local store. Bump it with every change to
    `types.ts` and teach `store.ts#migrate` the step. Lives on its own so
    the seed and the store can both read it without importing each other. */
export const STORE_VERSION = 10;
