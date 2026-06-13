import API_URL, { API_BASE_URL, getAuthHeaders, getAuthToken, requestJson } from "./http";

export const addContact = async (contactUserId) => {
  return requestJson(
    `${API_URL}/chat/contacts/add`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ contactUserId }),
    },
    { fallbackMessage: "Failed to add contact", authAware: true }
  );
};

export const sendMessage = async (receiverId, text, image) => {
  return requestJson(
    `${API_URL}/chat/messages/${receiverId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, image }),
    },
    { fallbackMessage: "Failed to send message", authAware: true }
  );
};

export const getContacts = async () => {
  return requestJson(
    `${API_URL}/chat/contacts`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to load contacts", authAware: true }
  );
};

export const getMessages = async (otherUserId) => {
  return requestJson(
    `${API_URL}/chat/messages?otherUserId=${otherUserId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
    { fallbackMessage: "Failed to load messages", authAware: true }
  );
};

export const deleteContacts = async (contactIds) => {
  return requestJson(
    `${API_URL}/chat/contacts`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ contactIds }),
    },
    { fallbackMessage: "Failed to delete contacts", authAware: true }
  );
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${API_URL}/uploads/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload image");
  }
  const data = await res.json();
  return data.data.path;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/uploads/file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload file");
  }
  const data = await res.json();
  return data.data.path;
};

export { API_BASE_URL as SOCKET_URL };
