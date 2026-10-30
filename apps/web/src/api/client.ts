import { Shop, MissedCall, User, AdminTalk, AdminStats } from "../types";

const API_BASE = "http://localhost:4000/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("involynk_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("involynk_token", data.token);
    localStorage.setItem("involynk_user", JSON.stringify(data.user));
    return data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    businessName: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Registration failed" }));
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("involynk_token", data.token);
    localStorage.setItem("involynk_user", JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem("involynk_token");
    localStorage.removeItem("involynk_user");
  },

  getStoredUser(): User | null {
    try {
      const u = localStorage.getItem("involynk_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem("involynk_token");
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        localStorage.removeItem("involynk_token");
        localStorage.removeItem("involynk_user");
        return null;
      }
      const user = await res.json();
      localStorage.setItem("involynk_user", JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  // Shops (Strictly filtered by logged in owner)
  async getShops(): Promise<Shop[]> {
    const res = await fetch(`${API_BASE}/shops`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load stores");
    return res.json();
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const res = await fetch(`${API_BASE}/shops`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(shopData),
    });
    if (!res.ok) throw new Error("Failed to create store");
    return res.json();
  },

  async updateShop(shopId: string, shopData: Partial<Shop>): Promise<Shop> {
    const res = await fetch(`${API_BASE}/shops/${shopId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(shopData),
    });
    if (!res.ok) throw new Error("Failed to update store");
    return res.json();
  },

  // Missed Calls (Strictly filtered by shop and owner)
  async getMissedCalls(shopId: string): Promise<MissedCall[]> {
    const res = await fetch(`${API_BASE}/missed-calls?shopId=${shopId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load missed calls");
    return res.json();
  },

  async createMissedCall(callData: Partial<MissedCall>): Promise<MissedCall> {
    const res = await fetch(`${API_BASE}/missed-calls`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(callData),
    });
    if (!res.ok) throw new Error("Failed to record missed call");
    return res.json();
  },

  async simulateConflict(shopId: string, shopName?: string, phoneA?: string, phoneB?: string): Promise<{ winner: MissedCall; runnerUp: MissedCall; tieBreakExplanation: string }> {
    const res = await fetch(`${API_BASE}/missed-calls/simulate-conflict`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ shopId, shopName, phoneA, phoneB }),
    });
    if (!res.ok) throw new Error("Failed to simulate conflict");
    return res.json();
  },

  async ackWhatsApp(callId: string): Promise<void> {
    await fetch(`${API_BASE}/missed-calls/ack-whatsapp`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ callId }),
    });
  },

  // Admin Portal (Global Platform Visibility across all stores & owners)
  async getAdminTalks(filters?: {
    search?: string;
    shopName?: string;
    outcome?: string;
    scoreBand?: string;
  }): Promise<AdminTalk[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.shopName) params.append("shopName", filters.shopName);
    if (filters?.outcome) params.append("outcome", filters.outcome);
    if (filters?.scoreBand) params.append("scoreBand", filters.scoreBand);

    const query = params.toString() ? `?${params.toString()}` : "";
    const headers: Record<string, string> = {
      ...(getHeaders() as Record<string, string>),
      "x-admin-key": "involynk_admin_secret_2026",
    };
    const res = await fetch(`${API_BASE}/admin/talks${query}`, { headers });
    if (!res.ok) throw new Error("Failed to load admin platform talks");
    return res.json();
  },

  async getAdminStats(): Promise<AdminStats> {
    const headers: Record<string, string> = {
      ...(getHeaders() as Record<string, string>),
      "x-admin-key": "involynk_admin_secret_2026",
    };
    const res = await fetch(`${API_BASE}/admin/stats`, { headers });
    if (!res.ok) throw new Error("Failed to load admin platform stats");
    return res.json();
  },

  // Gemini Voice Agent Pipeline
  async sendVoiceTurn(payload: {
    shopId?: string;
    customerSpeech: string;
    conversationHistory: any[];
    currentPhase?: string;
    callSid?: string;
    leadName?: string;
    leadPhoneNumber?: string;
  }) {
    const res = await fetch(`${API_BASE}/voice/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to process voice turn");
    return res.json();
  },

  async saveCallRecord(record: any) {
    const res = await fetch(`${API_BASE}/voice/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error("Failed to save call record");
    return res.json();
  },

  async getCallDetail(params: { phone?: string; callSid?: string; shopId?: string }) {
    const q = new URLSearchParams();
    if (params.phone) q.append("phone", params.phone);
    if (params.callSid) q.append("callSid", params.callSid);
    if (params.shopId) q.append("shopId", params.shopId);
    const res = await fetch(`${API_BASE}/voice/detail?${q.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // ─── Product Catalog ──────────────────────────────────────────────────────
  async getCatalog(shopId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/catalog?shopId=${encodeURIComponent(shopId)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch catalog");
    return res.json();
  },

  async createProduct(product: any): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
  },

  async updateProduct(id: string, product: any): Promise<any> {
    const res = await fetch(`${API_BASE}/catalog/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Failed to update product");
    return res.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/catalog/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete product");
  },
};

