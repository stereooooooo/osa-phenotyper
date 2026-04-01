/**
 * OSA Phenotyper – Authentication Module (Cognito)
 * Uses amazon-cognito-identity-js via CDN (loaded in index.html).
 *
 * Exposes: window.OSAAuth
 */
const OSAAuth = (function () {
  'use strict';

  // Populated from js/aws-config.js
  let poolData = null;
  let userPool = null;

  function init(config) {
    poolData = {
      UserPoolId: config.userPoolId,
      ClientId: config.userPoolClientId,
    };
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  }

  /* ── Get current session (returns tokens or null) ────────── */
  function getSession() {
    return new Promise((resolve) => {
      const user = userPool.getCurrentUser();
      if (!user) return resolve(null);
      user.getSession((err, session) => {
        if (err || !session || !session.isValid()) return resolve(null);
        resolve(session);
      });
    });
  }

  /* ── Get ID token for API calls ──────────────────────────── */
  async function getIdToken() {
    const session = await getSession();
    return session ? session.getIdToken().getJwtToken() : null;
  }

  /* ── Get current user's email ────────────────────────────── */
  async function getUserEmail() {
    const session = await getSession();
    if (!session) return null;
    const payload = session.getIdToken().decodePayload();
    return payload.email || null;
  }

  /* ── Sign in ─────────────────────────────────────────────── */
  function signIn(email, password) {
    return new Promise((resolve, reject) => {
      const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: email,
        Pool: userPool,
      });
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => resolve({ session, challenge: null }),
        onFailure: (err) => reject(err),
        newPasswordRequired: (userAttributes) => {
          resolve({
            session: null,
            challenge: 'NEW_PASSWORD_REQUIRED',
            cognitoUser,
            userAttributes,
          });
        },
        totpRequired: () => {
          resolve({
            session: null,
            challenge: 'MFA_REQUIRED',
            cognitoUser,
          });
        },
      });
    });
  }

  /* ── Complete new password challenge ─────────────────────── */
  function completeNewPassword(cognitoUser, newPassword) {
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: (session) => resolve(session),
        onFailure: (err) => reject(err),
      });
    });
  }

  /* ── Complete MFA challenge ──────────────────────────────── */
  function completeMfa(cognitoUser, code) {
    return new Promise((resolve, reject) => {
      cognitoUser.sendMFACode(code, {
        onSuccess: (session) => resolve(session),
        onFailure: (err) => reject(err),
      }, 'SOFTWARE_TOKEN_MFA');
    });
  }

  /* ── Sign out ────────────────────────────────────────────── */
  function signOut() {
    const user = userPool.getCurrentUser();
    if (user) user.signOut();
  }

  /* ── Check if signed in ──────────────────────────────────── */
  async function isAuthenticated() {
    const session = await getSession();
    return session !== null;
  }

  /* ── Idle timeout (15 min) ───────────────────────────────── */
  let idleTimer = null;
  const IDLE_MS = 15 * 60 * 1000;

  function resetIdleTimer(onTimeout) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      signOut();
      if (onTimeout) onTimeout();
    }, IDLE_MS);
  }

  function startIdleWatch(onTimeout) {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) =>
      document.addEventListener(evt, () => resetIdleTimer(onTimeout), { passive: true })
    );
    resetIdleTimer(onTimeout);
  }

  function stopIdleWatch() {
    clearTimeout(idleTimer);
  }

  return {
    init,
    signIn,
    signOut,
    completeNewPassword,
    completeMfa,
    getSession,
    getIdToken,
    getUserEmail,
    isAuthenticated,
    startIdleWatch,
    stopIdleWatch,
  };
})();
