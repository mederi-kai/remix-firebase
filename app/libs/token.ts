import { session } from "~/cookies";
import { auth as serverAuth } from "~/firebase.server";

export const checkToken = async (request: Request) => {
  // Get the cookie value (JWT)
  const jwt = await session.parse(request.headers.get("Cookie"));

  if (!jwt) {
    return undefined;
  }
  const token = await serverAuth.verifySessionCookie(jwt);
  if (!token) {
    return undefined;
  }
  return token;
};
