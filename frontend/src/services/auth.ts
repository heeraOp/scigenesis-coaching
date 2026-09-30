/* =========================================================
   SCI TEACHER AUTHENTICATION SERVICE
   ========================================================= */

const API_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL as
    | string
    | undefined;


/* =========================================================
   TYPES
   ========================================================= */

export interface TeacherUser {
  teacher_id: string;
  username: string;
  name: string;
  role: string;
}


export interface AuthResponse {
  success: boolean;

  authenticated?: boolean;

  message?: string;

  error?: string;

  session_token?: string;

  teacher?: TeacherUser;
}


/* =========================================================
   SESSION STORAGE
   ========================================================= */

const SESSION_KEY =
  "sci_teacher_session";


/* =========================================================
   API URL
   ========================================================= */

function getApiUrl(): string {

  if (!API_URL) {

    throw new Error(
      "VITE_APPS_SCRIPT_URL is not configured."
    );

  }

  return API_URL;
}


/* =========================================================
   GET SESSION TOKEN
   ========================================================= */

export function getSessionToken(): string {

  return (
    sessionStorage.getItem(
      SESSION_KEY
    ) || ""
  );

}


/* =========================================================
   CHECK WHETHER A SESSION TOKEN EXISTS
   ========================================================= */

export function hasSession(): boolean {

  return Boolean(
    getSessionToken()
  );

}


/* =========================================================
   SAVE SESSION TOKEN
   ========================================================= */

export function saveSession(
  token: string
): void {

  if (!token) {
    return;
  }

  sessionStorage.setItem(
    SESSION_KEY,
    token
  );

}


/* =========================================================
   CLEAR SESSION
   ========================================================= */

export function clearSession(): void {

  sessionStorage.removeItem(
    SESSION_KEY
  );

}


/* =========================================================
   LOGIN TEACHER
   ========================================================= */

export async function loginTeacher(
  username: string,
  password: string
): Promise<AuthResponse> {

  const cleanUsername =
    username.trim();

  const cleanPassword =
    password;


  if (!cleanUsername) {

    throw new Error(
      "Username is required."
    );

  }


  if (!cleanPassword) {

    throw new Error(
      "Password is required."
    );

  }


  const response =
    await fetch(
      getApiUrl(),
      {
        method: "POST",

        body: JSON.stringify({
          action: "login",

          username:
            cleanUsername,

          password:
            cleanPassword,
        }),
      }
    );


  let data:
    AuthResponse;


  try {

    data =
      (await response.json()) as
        AuthResponse;

  } catch {

    throw new Error(
      "The authentication server returned an invalid response."
    );

  }


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data.error ||
      data.message ||
      "Unable to log in."
    );

  }


  if (
    !data.session_token
  ) {

    throw new Error(
      "Login succeeded but no session token was returned."
    );

  }


  /* -------------------------------------------------------
     Save temporary session
     ------------------------------------------------------- */

  saveSession(
    data.session_token
  );


  return data;

}


/* =========================================================
   VALIDATE CURRENT SESSION
   ========================================================= */

export async function validateSession():
  Promise<AuthResponse> {

  const token =
    getSessionToken();


  /* -------------------------------------------------------
     No token = not authenticated
     ------------------------------------------------------- */

  if (!token) {

    return {
      success:
        false,

      authenticated:
        false,
    };

  }


  try {

    const response =
      await fetch(
        getApiUrl(),
        {
          method: "POST",

          body: JSON.stringify({
            action:
              "validateSession",

            session_token:
              token,
          }),
        }
      );


    let data:
      AuthResponse;


    try {

      data =
        (await response.json()) as
          AuthResponse;

    } catch {

      clearSession();

      return {
        success:
          false,

        authenticated:
          false,

        error:
          "Invalid authentication server response.",
      };

    }


    /* -----------------------------------------------------
       Invalid / expired session
       ----------------------------------------------------- */

    if (
      !response.ok ||
      !data.success ||
      data.authenticated === false
    ) {

      clearSession();

      return {
        ...data,

        success:
          false,

        authenticated:
          false,
      };

    }


    /* -----------------------------------------------------
       Valid session
       ----------------------------------------------------- */

    return {
      ...data,

      success:
        true,

      authenticated:
        true,
    };

  } catch (error) {

    /*
     * Network failure is different from an
     * invalid session.
     *
     * Do not automatically destroy the session
     * just because the network temporarily failed.
     */

    console.error(
      "Session validation failed:",
      error
    );


    throw error;

  }

}


/* =========================================================
   LOGOUT TEACHER
   ========================================================= */

export async function logoutTeacher():
  Promise<void> {

  const token =
    getSessionToken();


  try {

    /*
     * Tell Google Apps Script to invalidate
     * the server-side session.
     */

    if (
      token &&
      API_URL
    ) {

      try {

        await fetch(
          API_URL,
          {
            method: "POST",

            body: JSON.stringify({
              action:
                "logout",

              session_token:
                token,
            }),
          }
        );

      } catch (error) {

        /*
         * Even if the server request fails,
         * the local session must still be
         * removed.
         */

        console.error(
          "Server logout request failed:",
          error
        );

      }

    }

  } finally {

    /*
     * Always remove the browser session.
     */

    clearSession();

  }

}


/* =========================================================
   OPTIONAL SIMPLE AUTH CHECK
   ========================================================= */

export async function isAuthenticated():
  Promise<boolean> {

  const token =
    getSessionToken();


  if (!token) {

    return false;

  }


  try {

    const result =
      await validateSession();


    return (
      result.success === true &&
      result.authenticated === true
    );

  } catch {

    /*
     * Network error:
     * do not claim the user is logged out.
     */

    return false;

  }

}