import type { MetaFunction } from "@remix-run/node";
import { LoaderFunction, redirect } from "@remix-run/node";
import { checkToken } from "~/libs/token";

export const meta: MetaFunction = () => {
  return [
    { title: "Firebase Remix App" },
    { name: "description", content: "Firebase Remix App" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const token = await checkToken(request);
  if (!token) return redirect("/login");
  try {
    const profile = { uid: token.uid };
    console.log(profile);
    return redirect("/file");
  } catch (e: unknown) {
    // Invalid JWT - log them out (see below)
    return redirect("/logout");
  }
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
            Remix Docs
          </a>
        </li>
      </ul>
    </div>
  );
}
