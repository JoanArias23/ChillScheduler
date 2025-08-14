"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import Button from "./ui/Button";
import { User, LogOut } from "lucide-react";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkUser();

    // Listen for auth events
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          checkUser();
          setShowAuthModal(false);
          break;
        case "signedOut":
          setUser(null);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {user.username || user.userId}
        </span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="primary" 
        size="sm" 
        onClick={() => setShowAuthModal(true)}
      >
        <User size={16} />
        Sign In
      </Button>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}