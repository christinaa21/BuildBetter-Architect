import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://build-better.site/api/v1";

// Types for API responses
export interface LoginResponse {
  code: number;
  status: string;
  data?: {
    token: string;
    userId: string;
    email: string;
    username: string;
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

export interface PhotoUploadPayload {
  uri: string;
  type: string; // MIME type e.g., 'image/jpeg'
  name: string; // Filename e.g., 'profile.jpg'
}

export interface UpdateProfileData {
  email: string;
  username: string;
  photo: PhotoUploadPayload | null; // Updated to use PhotoUploadPayload
  province: string;
  city: string;
  phoneNumber: string;
  experience: number;
  rateOnline: number;
  rateOffline: number;
  portfolio: string;
}

export interface UpdateProfileResponse {
  code: number;
  status: string;
  message?: string;
  error?: string | string[];
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  code: number;
  status: string;
  message?: string;
  error?: string;
}

export interface GetConsultationRequestParams {
  type?: "online" | "offline";
  status?:
    | "waiting-for-payment"
    | "waiting-for-conifrmation"
    | "cancelled"
    | "scheduled"
    | "in-progress"
    | "ended";
  includeCancelled?: boolean;
  upcoming?: boolean;
}

export interface Consultation {
  id: string;
  userId: string;
  userName: string;
  userCity: string;
  architectId: string;
  architectName: string;
  architectCity: string;
  roomId: string | null;
  type: "online" | "offline";
  total: number;
  status:
    | "waiting-for-payment"
    | "waiting-for-conifrmation"
    | "cancelled"
    | "scheduled"
    | "in-progress"
    | "ended";
  reason: string | null;
  location: string;
  locationDescription: string | null;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface GetArchitectConsultationResponse {
  code: number;
  status: string;
  data?: Consultation[];
  error?: string;
}

export interface Room {
  id: string;
  architectId: string;
  userId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface GetRoomByIdResponse {
  code: number;
  status: string;
  data?: Room;
  error?: string;
}

export interface Chat {
  id: string;
  roomId: string;
  sender: string;
  senderRole: string | null;
  content: string;
  type: "TEXT" | "FILE";
  createdAt: string;
}

export interface getAllChatsByRoomIdResponse {
  code: number;
  status: string;
  data?: Chat[];
  error?: string;
}

// API client
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("userToken");
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
      const response = await apiClient.post<LoginResponse>(
        "/architects/login",
        {
          email: data.email,
          password: data.password,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as LoginResponse;
      }
      throw error;
    }
  },

  // Store authentication data
  storeAuthData: async (data: LoginResponse["data"]) => {
    if (!data || !data.token) return;

    await SecureStore.setItemAsync("userToken", data.token);
    await SecureStore.setItemAsync("userId", data.userId);
    await SecureStore.setItemAsync("email", data.email);
    await SecureStore.setItemAsync("username", data.username);
  },

  // Update specific auth data fields
  updateAuthData: async (updates: { email?: string; username?: string }) => {
    if (updates.email) {
      await SecureStore.setItemAsync("email", updates.email);
    }
    if (updates.username) {
      await SecureStore.setItemAsync("username", updates.username);
    }
  },

  // Clear authentication data
  clearAuthData: async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userId");
    await SecureStore.deleteItemAsync("email");
    await SecureStore.deleteItemAsync("username");
  },

  // Get user profile
  getUserProfile: async (): Promise<UserProfileResponse> => {
    try {
      const response = await apiClient.get<UserProfileResponse>(
        "/architects/me"
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as UserProfileResponse;
      }
      return {
        code: 500,
        status: "ERROR",
        error:
          "Network or server error. Please check your connection and try again.",
      };
    }
  },

  updateProfile: async (
    data: UpdateProfileData
  ): Promise<UpdateProfileResponse> => {
    try {
      const formData = new FormData();

      // Append all regular fields
      formData.append("email", data.email);
      formData.append("username", data.username);
      formData.append("province", data.province);
      formData.append("city", data.city);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("experience", data.experience.toString());
      formData.append("rateOnline", data.rateOnline.toString());
      formData.append("rateOffline", data.rateOffline.toString());
      formData.append("portfolio", data.portfolio || ""); // Handle potentially null/undefined portfolio

      // Append photo if it exists and has a URI
      if (data.photo && data.photo.uri) {
        const photoPayload: any = {
          // Cast to any to satisfy FormData append if TS complains
          uri: data.photo.uri,
          type: data.photo.type,
          name: data.photo.name,
        };
        formData.append("photo", photoPayload); // 'photo' must match backend's expected field name for the file
      }

      // Make the PATCH request with FormData.
      // We override the headers for THIS specific request.
      const response = await apiClient.patch<UpdateProfileResponse>(
        "/architects",
        formData,
        {
          headers: {
            // By setting 'Content-Type' to null or undefined here,
            // we instruct Axios to remove any default 'Content-Type' (like 'application/json')
            // and then automatically set the correct 'multipart/form-data' header
            // with the appropriate boundary, because the `data` argument (`formData`) is an instance of FormData.
            "Content-Type": null, // Or 'Content-Type': undefined
          },
        }
      );

      // If update is successful, update SecureStore with new email and username
      if (response.data.code === 200) {
        await authApi.updateAuthData({
          email: data.email,
          username: data.username,
        });
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error updating profile:", error.message);
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          console.error("Error response headers:", error.response.headers); // Log response headers from server
        }
        // Log the request config headers to see what Axios actually tried to send
        if (error.config) {
          console.error(
            "Request config headers Axios tried to send:",
            error.config.headers
          );
        }
        return (
          (error.response?.data as UpdateProfileResponse) || {
            code: error.response?.status || 500,
            status: "ERROR",
            error: error.message || "An unknown Axios error occurred",
          }
        );
      }
      console.error("Non-Axios error updating profile:", error);
      return {
        code: 500,
        status: "ERROR",
        error: "An unexpected error occurred. Please try again.",
      };
    }
  },

  changePassword: async (
    data: ChangePasswordData
  ): Promise<ChangePasswordResponse> => {
    try {
      const response = await apiClient.patch<ChangePasswordResponse>(
        "/architects/change-password",
        {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmNewPassword,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ChangePasswordResponse;
      }
      return {
        code: 500,
        status: "ERROR",
        error:
          "Network or server error. Please check your connection and try again.",
      };
    }
  },

  // GET ALL CURRENT ARCHITECT CONSULTATIONS
  getConsultation: async (
    data: GetConsultationRequestParams
  ): Promise<GetArchitectConsultationResponse> => {
    try {
      const response = await apiClient.get<GetArchitectConsultationResponse>(
        "/architects/consultations",
        {
          params: {
            type: data.type,
            status: data.status,
            includeCancelled: data.includeCancelled,
            upcoming: data.upcoming,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as GetArchitectConsultationResponse;
      }
      return {
        code: 500,
        status: "ERROR",
        error:
          "Network or server error. Please check your connection and try again.",
      };
    }
  },

  // GET CONSULTATION BY ID
  getConsultationById: async (
    consultationId: string
  ): Promise<GetArchitectConsultationResponse> => {
    try {
      const response = await apiClient.get<GetArchitectConsultationResponse>(
        `/consultations/${consultationId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as GetArchitectConsultationResponse;
      }
      throw error; // Rethrow unexpected errors
    }
  },

  // GET ROOMS BY ID
  getRoomById: async (roomId: string): Promise<GetRoomByIdResponse> => {
    try {
      const response = await apiClient.get<GetRoomByIdResponse>(
        `/rooms/${roomId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as GetRoomByIdResponse; // Return null if room not found or error occurs
      }
      throw error; // Rethrow unexpected errors
    }
  },

  // GET ALL CHAT OF ROOMS
  getChatByRoomId: async (
    roomId: string
  ): Promise<getAllChatsByRoomIdResponse> => {
    try {
      const response = await apiClient.get(`/chats/${roomId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as getAllChatsByRoomIdResponse; // Return null if room not found or error occurs
      }
      throw error; // Rethrow unexpected errors
    }
  },
};
