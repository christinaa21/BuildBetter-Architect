import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://build-better.site/api/v1';

// Types for API responses
export interface LoginResponse {
  code: number;
  status: string;
  data?: {
    token: string;
    userId: string;
    email: string;
  };
  error?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// User profile response type
export interface UserProfileResponse {
  code: number;
  status: string;
  data?: {
    id: string;
    email: string;
    username: string;
    photo: null | string;
    province: string;
    city: string;
    phoneNumber: string;
    experience: number;
    rateOnline: number;
    rateOffline: number;
    portfolio: string;
  };
  error?: string;
}

export interface UpdateProfileData {
  phoneNumber: string;
  email: string;
  username: string;
  province: string;
  city: string;
  photo: string;
}

export interface UpdateProfileResponse {
  code: number;
  status: string;
  message?: string;
  error?: string | string[];
}

// API client
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authApi = {
  // Login only requires email and password
  login: async (data: LoginData): Promise<LoginResponse> => {
    try {
      // We only send email and password in the request body
      const response = await apiClient.post<LoginResponse>('/architects/login', {
        email: data.email,
        password: data.password
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as LoginResponse;
      }
      throw error;
    }
  },
  
  // Store authentication data
  storeAuthData: async (data: LoginResponse['data']) => {
    if (!data || !data.token) return;
   
    await SecureStore.setItemAsync('userToken', data.token);
    await SecureStore.setItemAsync('userId', data.userId);
    await SecureStore.setItemAsync('userEmail', data.email);
  },
 
  // Clear authentication data
  clearAuthData: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userEmail');
  },

  // Get user profile
  getUserProfile: async (): Promise<UserProfileResponse> => {
    try {
      const response = await apiClient.get<UserProfileResponse>('/architects/me');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as UserProfileResponse;
      }
      // Create a standardized error response for network or unexpected errors
      return {
        code: 500,
        status: 'ERROR',
        error: 'Network or server error. Please check your connection and try again.'
      };
    }
  },
  
  updateProfile: async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
    try {
      const response = await apiClient.patch<UpdateProfileResponse>('/architects', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as UpdateProfileResponse;
      }
      return {
        code: 500,
        status: 'ERROR',
        error: 'Network or server error. Please check your connection and try again.'
      };
    }
  },
};