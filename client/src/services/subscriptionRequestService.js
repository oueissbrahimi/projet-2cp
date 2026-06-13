import API_URL, { getAuthHeaders, requestJson } from "./http";

export const createSubscriptionRequest = async (tier, attachmentFile = null) => {
  const token = localStorage.getItem("token");
  if (attachmentFile) {
    const formData = new FormData();
    formData.append("tier", tier);
    formData.append("attachment", attachmentFile);
    const res = await fetch(`${API_URL}/subscription-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { message: err.message || "Failed to create subscription request", status: res.status };
    }
    return res.json();
  }
  return requestJson(
    `${API_URL}/subscription-requests`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ tier }),
    },
    { fallbackMessage: "Failed to create subscription request", authAware: true }
  );
};

export const getMySubscriptionRequest = async () => {
  return requestJson(
    `${API_URL}/subscription-requests/me`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to fetch subscription request", authAware: true }
  );
};

export const listSubscriptionRequests = async (status = null) => {
  const url = status
    ? `${API_URL}/subscription-requests?status=${encodeURIComponent(status)}`
    : `${API_URL}/subscription-requests`;

  const data = await requestJson(
    url,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to list subscription requests", authAware: true }
  );

  return {
    requests: Array.isArray(data?.requests) ? data.requests : [],
    total: Number(data?.total ?? 0),
  };
};

export const acceptSubscriptionRequest = async (requestId) => {
  return requestJson(
    `${API_URL}/subscription-requests/${encodeURIComponent(String(requestId))}/accept`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to accept subscription request", authAware: true }
  );
};

export const rejectSubscriptionRequest = async (requestId) => {
  return requestJson(
    `${API_URL}/subscription-requests/${encodeURIComponent(String(requestId))}/reject`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to reject subscription request", authAware: true }
  );
};

export const refreshSubscription = async (subId) => {
  return requestJson(
    `${API_URL}/subscription-requests/refresh/${encodeURIComponent(String(subId))}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to refresh subscription", authAware: true }
  );
};
