"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import WalletDisplay from "./wallet-display";
import { useRouter } from "next/navigation";

export default function LoginButton() {
  const { user, ready, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { login } = useLogin({
    onComplete: () => {
      setIsLoading(false);
    },
    onError: () => setIsLoading(false),
  });

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      {authenticated && user && user.wallet?.address ? (
        <WalletDisplay />
      ) : (
        <Button
          variant="primary"
          size="default"
          className="rounded-full cursor-pointer"
          disabled={!ready}
          onClick={handleLogin}
        >
          <span>Login</span>
        </Button>
      )}
    </div>
  );
}
