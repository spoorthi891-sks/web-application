import { useEffect, useState } from "react";

const SESSION_KEY = "highrise_session";
const KEYS_KEY = "highrise_api_keys";

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function readJson(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getSession() {
  return readJson(SESSION_KEY, null);
}

export function signIn({ email, name }) {
  const session = {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    org: (email.split("@")[1] ?? "personal").split(".")[0],
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export function getApiKeys() {
  const session = getSession();
  if (!session) return [];
  return readJson(KEYS_KEY, [])
    .filter((entry) => entry.owner === session.email)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function saveApiKey({ apiKey, modelName, planName, modelId }) {
  const session = getSession();
  if (!session) return;
  const all = readJson(KEYS_KEY, []);
  all.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    owner: session.email,
    key: apiKey,
    model: modelName,
    modelId: modelId ?? null,
    plan: planName,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(KEYS_KEY, JSON.stringify(all));
  emit();
}

export function useAuth() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { session: getSession(), apiKeys: getApiKeys(), tick };
}
