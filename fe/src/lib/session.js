import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// Session configuration
export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "your-secret-key-min-32-characters-long-change-in-production",
  cookieName: "dashstore-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  },
};

// Session data structure
export const defaultSession = {
  user: null,
  jwt: null,
  isLoggedIn: false,
  // user structure:
  // {
  //   id: number,
  //   username: string,
  //   email: string,
  //   mobile: string,
  //   name: string,
  //   type: string,
  //   stores: array of store objects
  // }
};

// Get session (server-side)
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);

  if (!session.user) {
    session.user = null;
    session.jwt = null;
    session.isLoggedIn = false;
  }

  return session;
}

// Save session (server-side)
export async function saveSession(session) {
  const cookieStore = await cookies();
  const ironSession = await getIronSession(cookieStore, sessionOptions);

  ironSession.user = session.user;
  ironSession.jwt = session.jwt;
  ironSession.isLoggedIn = session.isLoggedIn;

  await ironSession.save();
}

// Destroy session (server-side)
export async function destroySession() {
  const cookieStore = await cookies();
  const ironSession = await getIronSession(cookieStore, sessionOptions);
  ironSession.destroy();
}
