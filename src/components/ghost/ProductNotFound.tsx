import { Link } from "@tanstack/react-router";
import { GhostShell } from "./Shell";

export function ProductNotFound() {
  return (
    <GhostShell>
      <section className="mx-auto max-w-xl py-20 text-center">
        <h1 className="text-2xl font-bold text-[#0b1020] dark:text-white">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-blue-600 dark:text-blue-300">
          Back to products
        </Link>
      </section>
    </GhostShell>
  );
}
