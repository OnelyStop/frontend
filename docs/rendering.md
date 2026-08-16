# Rendering in Next.js App Router

> Two things people think are one thing: **where your code runs**, and **where
> your data comes from**. Keep them separate and everything else clicks.

---

## 1. The two questions

Answer these **independently** for every screen:

**Q1 — When is the HTML made?**
Build time · Per request · In the browser

**Q2 — Does this component's code ship to the browser?**
Server Component (no) · Client Component (yes)

A page can be built per-request *and* contain client components. They're
different dials.

---

## 2. Four ways to make a page

Think of it like food:

| | How it works | Speed |
|---|---|---|
| **Static** | Cooked at deploy, sitting ready | Instant |
| **ISR** | Cooked at deploy, re-cooked on a timer | Instant |
| **SSR** | Cooked fresh when you order | Fast |
| **CSR** | You get ingredients and cook it yourself | Slowest to first bite |

**Static** — the default. Same HTML for everyone.

```tsx
export default function Page() {
  return <Pricing />;   // built once, served from CDN
}
```

**ISR** — static, but refreshed on a schedule. One extra line.

```tsx
export const revalidate = 3600;   // re-bake at most once an hour

export default async function Page() {
  const posts = await db.getPosts();
  return <PostList posts={posts} />;
}
```

Best of both: CDN-fast, but content updates without a redeploy.

**SSR (dynamic)** — rebuilt per request. You don't configure this; it happens
automatically when you read request-specific things:

```tsx
export default async function Page() {
  const cookieStore = await cookies();   // ← this makes it dynamic
  ...
}
```

Triggers: `cookies()`, `headers()`, `await searchParams`.

**CSR** — the browser builds it. Rare, and always a deliberate opt-out.

**How to check what you got.** Run the build and read the symbols:

- `○` static
- `ƒ` dynamic

---

## 3. Server vs Client Components

|  | Server Component | Client Component |
|---|---|---|
| Code sent to browser | ❌ | ✅ |
| Read the database | ✅ | ❌ |
| Use secrets / API keys | ✅ | ❌ never |
| `useState`, `onClick` | ❌ | ✅ |
| Can be `async` | ✅ | ❌ |
| Default | ✅ | needs `"use client"` |

Because a Server Component's code never leaves the server, it can do things a
browser must never do:

```tsx
export default async function Page() {
  const key = process.env.API_KEY;          // ✅ never shipped
  const rows = await db.query('SELECT ...'); // ✅ direct DB access
  return <h1>{rows.length} items</h1>;
}
```

The browser receives `<h1>1240 items</h1>`. Not the key. Not the query.

---

## 4. The big one: `"use client"` is still server-rendered

> `"use client"` does **not** mean "runs in the browser instead".
> It means "**also** send this to the browser".

Client Components run **twice**:

```
1. on the server  → makes the initial HTML
2. in the browser → "hydration" — wakes up the buttons
```

So a `"use client"` page still arrives as real HTML. You can prove it:

```bash
curl localhost:3000/login | grep "Welcome back"   # it's there
```

**Why this matters:** the two renders must produce **identical** output. If they
differ, React throws a hydration error.

---

## 5. The three rules that follow

Anything that differs between server and browser must be read **after mount**,
inside `useEffect`.

**❌ Browser-only APIs**

```tsx
const [x] = useState(localStorage.getItem("k"));   // crashes on the server
```

```tsx
const [x, setX] = useState(null);
useEffect(() => setX(localStorage.getItem("k")), []);   // ✅
```

**❌ Anything time-based**

```tsx
const days = daysUntil(examDate);   // build time ≠ browser time → mismatch
```

**❌ The URL fragment**

```tsx
const hash = window.location.hash;   // server never receives the #fragment
```

The `#hash` part of a URL is **never sent to the server**. Ever. So the server
literally cannot know it.

**The rule:** if the server can't know it, don't read it during render.

---

## 6. Where your *data* comes from is a separate question

This is the part that trips people up.

```tsx
"use client";
export function List() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetch('/api/rows').then(r => r.json()).then(setRows);   // ← never runs on server
  }, []);
  return <table>{rows.map(...)}</table>;
}
```

What actually happens:

1. Server renders it — but `useEffect` doesn't run on the server
2. So `rows` is `[]` → **server renders an empty table**
3. Browser hydrates, *then* fetches, *then* fills in

**Result: your component is SSR'd, but your data is not.**

| | `"use client"` + fetch | Server Component |
|---|---|---|
| 0ms | HTML arrives — empty | — |
| 220ms | — | HTML arrives **with data** ✅ |
| 650ms | data finally appears ✅ | done |

**Fix — fetch on the server, pass it down:**

```tsx
// page.tsx — SERVER
export default async function Page() {
  const rows = await db.getRows();
  return <List initial={rows} />;
}
```

```tsx
// list.tsx — CLIENT, starts full instead of empty
"use client";
export function List({ initial }) {
  const [rows, setRows] = useState(initial);
}
```

> `"use client"` decides whether your **code** ships.
> Where you fetch decides whether your **data** is in the HTML.

---

## 7. SSR is not "once" — it re-renders

A common misreading: *"SSR renders on the server, so how does data ever change?"*

The server re-renders whenever you tell it to:

```
1. Server renders the list      → HTML
2. User clicks Delete
3. Server deletes the row       → on the server
4. Server renders the list AGAIN → new HTML
5. New HTML swaps in
```

Step 4 is the piece people miss.

**Server Actions** are how you trigger it — a function that runs on the server,
with no API route in between:

```tsx
// actions.ts
"use server";

export async function deleteItem(id: string) {
  await db.delete(id);
  revalidatePath("/items");   // ← "re-render that page"
}
```

```tsx
// page.tsx — SERVER, no useState anywhere
export default async function Page() {
  const items = await db.getItems();

  return items.map(item => (
    <form key={item.id} action={deleteItem.bind(null, item.id)}>
      <span>{item.name}</span>
      <button>Delete</button>
    </form>
  ));
}
```

**`<form action={serverAction}>` needs zero client JavaScript.** It's a real
form post. React makes it smoother when JS is loaded, but it works without.

So full create/rename/delete can ship **no JavaScript at all**.

**When to add client JS:** only if the round trip feels slow. Then one small
component with `useOptimistic` makes the row vanish instantly while the server
catches up.

---

## 8. "Load more" — where the extra rows come from

| Approach | How | Extra rows in HTML? |
|---|---|---|
| **URL** — `<Link href="?limit=40">` | Server re-renders | ✅ Yes |
| **Client fetch** — `onClick` + `setState` | Browser fetches | ❌ No |
| **Server Action** — returns more rows | Server fetches, client appends | ❌ No |

- The **first batch is always SSR**, in all three.
- Anything added afterwards is client-rendered — **unless the URL changed**.
- So: if the extra content needs to be crawlable or shareable, put it in the URL.

Note that URL navigation doesn't feel like a page reload — the framework
swaps content in place with no document request.

---

## 9. Does SSR put more load on the server?

Measured on a small app:

| Mode | Server time |
|---|---|
| Static | **~3ms** |
| Dynamic | **~10ms** |

Three things worth knowing:

- **Static costs nothing.** It's a file on a CDN; your server isn't invoked.
- **CSR doesn't remove load, it moves it.** The database query happens either
  way — CSR just adds an API hop and a route to maintain.
- **Waiting on the database is usually not billed.** Serverless platforms
  increasingly charge for *active CPU*, and a function waiting on I/O is idle.

**What actually causes load:** sequential queries. Three awaits in a row holds
the function open 3× longer.

```tsx
const a = await getA();   // ❌ waterfall
const b = await getB();

const [a, b] = await Promise.all([getA(), getB()]);   // ✅
```

---

## 10. So when is CSR actually the right call?

SSR is the better default for most sites. CSR wins in a specific shape:

- **Long sessions** — users stay for an hour, not 30 seconds
- **Interaction-dense** — hundreds of actions per session
- **No search traffic** — behind a login, nobody googles it

Design tools, IDEs, and issue trackers fit this. The extreme version is
**local-first**: keep a real database in the browser, write locally, sync in
the background. Interactions become instant because nothing waits on a network.

The documented cost is high — conflict resolution, merge strategies, and sync
debugging are hard problems that consume real engineering time.

**The honest trade-off:**

| | SSR | CSR |
|---|---|---|
| First paint | Fast | Slow (blank, then spinner) |
| Later interactions | Server round trip | Instant |
| Crawlable | ✅ | ❌ |
| JavaScript shipped | Less | More |
| Server cost | Per request | Per API call |
| Complexity | Server/client boundary, hydration | Sync, caching, API layer |

Most products want both, split by surface — public pages SSR, the
interaction-heavy tool client-side.

---

## Cheat sheet

- Same for everyone → **static**
- Same for everyone but changes → **ISR** (`export const revalidate`)
- Different per user → **SSR** (reading cookies makes it automatic)
- Needs typing or clicking → **Client Component, as small as possible**
- `"use client"` = "also send to browser", **not** "browser only"
- Client Components render on the server too — no `window`, `localStorage`, or
  clock reads during render
- Fetching in `useEffect` = the server renders an **empty** page
- Mutations → **Server Action + `revalidatePath`**, not an API route
- Extra content that must be crawlable → put it **in the URL**
