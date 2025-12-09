import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
  } | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Sign up a new user
export async function signUp(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      name: name || null,
      is_admin: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Sign in user
export async function signIn(email: string, password: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user by ID
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, is_admin, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Validate session token (simple JWT-like approach using base64)
export function createSessionToken(userId: string, email: string, isAdmin: boolean): string {
  const payload = {
    userId,
    email,
    isAdmin,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  // Use btoa for Cloudflare Workers compatibility (no Buffer in edge runtime)
  return btoa(JSON.stringify(payload));
}

export function validateSessionToken(token: string): { userId: string; email: string; isAdmin: boolean } | null {
  try {
    // Use atob for Cloudflare Workers compatibility (no Buffer in edge runtime)
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin
    };
  } catch {
    return null;
  }
}

// Get session from cookies
export function getSessionFromCookies(cookieHeader: string | null): Session {
  if (!cookieHeader) {
    return { user: null };
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );

  const token = cookies['session'];
  if (!token) {
    return { user: null };
  }

  const payload = validateSessionToken(token);
  if (!payload) {
    return { user: null };
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      name: null, // Can be fetched if needed
      isAdmin: payload.isAdmin
    }
  };
}
