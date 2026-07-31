# AI Agent Instructions for Soji's Shawarma

## Next.js + Firebase Architecture
This project uses Next.js with `output: export` for static site generation, hosted on Firebase Hosting. 
Because of this configuration, there are specific constraints that any AI agent should follow:

1. **Dynamic Routes (`[id]`)**: Static export does not support dynamic server routes out of the box without `generateStaticParams`. Because Next.js forbids using BOTH `"use client"` and `generateStaticParams` in the same file, you MUST create a Server Component as `page.tsx` that exports `generateStaticParams` and imports a separate Client Component (e.g., `OrderDetailClient.tsx`).
   ```typescript
   // page.tsx
   import ClientComponent from './ClientComponent';
   
   export const dynamicParams = false;
   export async function generateStaticParams() {
     // CRITICAL: You must return at least one valid array item (like a 'placeholder' ID) 
     // Returning [] will cause Next.js to crash during static export.
     return [{ id: 'placeholder' }];
   }
   
   export default function Page() {
     return <ClientComponent />;
   }
   ```
2. **`useSearchParams()` Bailout**: Next.js 13+ static export will completely fail if any Client Component calls `useSearchParams()` unless it is wrapped in an explicit `<Suspense>` boundary. If you build a client component that reads query parameters, encapsulate its logic inside a subcomponent and render that subcomponent locally wrapped in `<Suspense fallback={...}>` in the default export.
3. **Server-Side Features**: Do not use `getServerSideProps`, Server Components that do runtime fetching, or core Server Actions that require a Node.js runtime, as this is a fully static export project.
4. **Data Fetching**: All runtime data fetching should occur on the client side (e.g., using Firebase Firestore client SDKs). Ensure to handle loading states effectively since pages will be served statically before data hydrates.
5. **Authentication / Firebase**: Firebase is initialized on the client side. Use the global state (`useAppStore` etc.) to check for hydration and authentication before redirecting users.
6. **Type Consistency**: Always ensure that TypeScript types exactly match the runtime implementations and data shapes in the JavaScript code.
