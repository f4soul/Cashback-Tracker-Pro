import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../firebase";
import { PlaceholderUser } from "../types";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | PlaceholderUser | null>(
    () => {
      const lastKnown = localStorage.getItem("cashback_last_known_user");
      if (lastKnown === "true") {
        return {
          uid: localStorage.getItem("cashback_cached_uid") || "cached",
          displayName:
            localStorage.getItem("cashback_cached_name") || "Пользователь",
          email: localStorage.getItem("cashback_cached_email") || "",
          photoURL: localStorage.getItem("cashback_cached_photo") || null,
          isPlaceholder: true,
        };
      }
      return null;
    },
  );

  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        localStorage.setItem("cashback_last_known_user", "true");
        localStorage.setItem("cashback_cached_uid", u.uid);
        localStorage.setItem(
          "cashback_cached_name",
          u.displayName || "Пользователь",
        );
        localStorage.setItem("cashback_cached_email", u.email || "");
        localStorage.setItem("cashback_cached_photo", u.photoURL || "");
      } else {
        setUser(null);
        localStorage.removeItem("cashback_last_known_user");
        localStorage.removeItem("cashback_cached_uid");
        localStorage.removeItem("cashback_cached_name");
        localStorage.removeItem("cashback_cached_email");
        localStorage.removeItem("cashback_cached_photo");
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    setUser,
    isAuthReady,
  };
}
