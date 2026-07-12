import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/auth.mock';
import { supabase, mapSupabaseError } from './supabase';
import type {
  ApiResponse,
  TokenResponse,
  RegisterRequest,
  VerifyEmailRequest,
  LoginRequest,
  RefreshRequest,
} from '@/types';
import type { User } from '@/types';

const ts = () => new Date().toISOString();

// Helper to map Supabase auth user to our User type
async function mapSupabaseUser(authUser: any): Promise<User> {
  // Fetch profile to get role and status
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role, status, is_verified, created_at')
    .eq('id', authUser.id)
    .single();

  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile?.full_name || authUser.user_metadata?.full_name || '',
    phone: profile?.phone || authUser.user_metadata?.phone || '',
    role: profile?.role || 'TENANT',
    status: profile?.status || 'ACTIVE',
    isVerifiedEmail: authUser.email_confirmed_at != null,
    createdAt: profile?.created_at || authUser.created_at || '',
  };
}

export async function register(
  req: RegisterRequest
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockRegister(req);
  
  const { data, error } = await supabase.auth.signUp({
    email: req.email,
    password: req.password,
    options: {
      data: {
        full_name: req.fullName,
        phone: req.phone,
        role: req.role,
      }
    }
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  if (!data.user) {
    return { success: false, data: null, error: { code: 'UNKNOWN_ERROR', message: 'User not returned' }, timestamp: ts() };
  }

  const user = await mapSupabaseUser(data.user);

  if (data.session) {
    return { 
      success: true, 
      data: {
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      } as any, 
      error: null, 
      timestamp: ts() 
    };
  }

  return { success: true, data: user, error: null, timestamp: ts() };
}

export async function verifyEmail(
  req: VerifyEmailRequest
): Promise<ApiResponse<{ verified: boolean }>> {
  if (USE_MOCKS) return mocks.mockVerifyEmail(req);
  
  const { error } = await supabase.auth.verifyOtp({
    email: req.email,
    token: req.otp, // Contract field is 'otp', not 'code'
    type: 'signup',
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: { verified: true }, error: null, timestamp: ts() };
}

export async function login(
  req: LoginRequest
): Promise<ApiResponse<TokenResponse>> {
  if (USE_MOCKS) return mocks.mockLogin(req);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.email,
    password: req.password,
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  const user = await mapSupabaseUser(data.user);
  
  return {
    success: true,
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function refresh(
  req: RefreshRequest
): Promise<ApiResponse<TokenResponse>> {
  if (USE_MOCKS) return mocks.mockRefresh(req);
  
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: req.refreshToken });
  
  if (error || !data.session) {
    return { success: false, data: null, error: error ? mapSupabaseError(error) : { code: 'UNAUTHORIZED', message: 'Refresh failed' }, timestamp: ts() };
  }

  const user = await mapSupabaseUser(data.user);

  return {
    success: true,
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function logout(
  refreshToken: string
): Promise<ApiResponse<{ loggedOut: boolean }>> {
  if (USE_MOCKS) return mocks.mockLogout(refreshToken);
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }
  
  return { success: true, data: { loggedOut: true }, error: null, timestamp: ts() };
}

export async function updateProfile(
  userId: string,
  profileData: { fullName: string; phone: string }
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockUpdateProfile(userId, profileData);
  
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: profileData.fullName, phone: profileData.phone })
    .eq('id', userId);

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' }, timestamp: ts() };

  const updatedUser = await mapSupabaseUser(userAuth.user);
  return { success: true, data: updatedUser, error: null, timestamp: ts() };
}
