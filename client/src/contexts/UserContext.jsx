import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../services/http";
import { resolveMediaUrl } from "../utils/media";

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    photo: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.warn("No token found in localStorage");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/profile/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;

          let fullName = "";
          if (data.individual?.full_Name) {
            fullName = data.individual.full_Name;
          } else if (data.business?.business_Name) {
            fullName = data.business.business_Name;
          } else if (data.displayName) {
            fullName = data.displayName;
          }

          const rawPhoto = data.profile_Photo || "";
          const photo = resolveMediaUrl(rawPhoto);

          setUserData({
            name: fullName,
            email: data.email || "",
            role: data.role || "USER",
            photo,
          });
        } else {
          const errorData = await res.text();
          console.error("Failed to fetch profile. Status:", res.status, "Response:", errorData);
          setError("Failed to fetch user profile");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Error fetching user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ userData, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};
