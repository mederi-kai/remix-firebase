import { ActionFunction, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { SyntheticEvent } from "react";
import {
  GoogleAuthProvider,
  UserCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth as clientAuth } from "~/firebase.client";
import { auth as serverAuth } from "~/firebase.server";
import { session } from "~/cookies";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const idToken = form.get("token")?.toString();
  if (!idToken) return redirect("/login");
  // Verify the idToken is actually valid
  await serverAuth.verifyIdToken(idToken);

  const jwt = await serverAuth.createSessionCookie(idToken, {
    // 5 days - can be up to 2 weeks
    expiresIn: 60 * 60 * 24 * 5 * 1000,
  });

  return redirect("/file", {
    headers: { "Set-Cookie": await session.serialize(jwt) },
  });
};

export default function Login() {
  const fetcher = useFetcher();

  async function handleSignInGoogle() {
    // Googleでログイン
    signInWithPopup(clientAuth, new GoogleAuthProvider()).then(
      async (credential: UserCredential) => {
        const idToken = await credential.user.getIdToken();
        // サーバー側にidTokenを送信
        fetcher.submit(
          { token: idToken },
          { method: "post", action: "/login" }
        );
      }
    );
  }

  async function handleSignInEmailAndPassword(e: SyntheticEvent) {
    // メールアドレス・パスワードでログイン
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };

    const email = target.email.value;
    const password = target.password.value;

    const credential = await signInWithEmailAndPassword(
      clientAuth,
      email,
      password
    );
    const idToken = await credential.user.getIdToken();
    // サーバー側にidTokenを送信
    fetcher.submit({ token: idToken }, { method: "post", action: "/login" });
  }

  return (
    <>
      <button onClick={handleSignInGoogle}>Sign In with Google</button>
      <fetcher.Form method="post" onSubmit={handleSignInEmailAndPassword}>
        <input type="email" name="email" placeholder="email" />
        <input type="password" name="password" placeholder="password" />
        <button type="submit">ログイン</button>
      </fetcher.Form>
    </>
  );
}
