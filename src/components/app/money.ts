/** "₹12,500" — safe to import from client and server components alike. */
export const money = (n: number) => "₹" + n.toLocaleString("en-IN");
