import { useQuery } from "@tanstack/react-query";
import { type Address } from "viem";
import { GRAPQL_URL } from "../constants/address";

export interface Invoice {
  id: string;
  internal_id: string;
  clientName: string;
  amount: string;
  status: string;
  createdAt: string;
  txHash: string;
  settledAt: string | null;
  settledTxHash: string | null;
  merchant?: string;
}

export function useUserInvoices(userAddress: Address | null, role: 'merchant' | 'payer' = 'merchant') {
  const queryFn = async () => {
    if (!userAddress) return [];

    const whereClause = role === 'merchant'
      ? `merchant: $address`
      : `payer: $address`;

    const query = `
      query GetInvoices($address: Bytes!) {
        invoices(where: { ${whereClause} }, orderBy: createdAt, orderDirection: desc) {
          id
          internal_id
          clientName
          amount
          status
          createdAt
          txHash
          settledAt
          settledTxHash
        }
      }
    `;

    const response = await fetch(GRAPQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          address: userAddress,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return (data.data.invoices as Invoice[]) || [];
  };

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userInvoices", userAddress, role],
    queryFn,
    enabled: !!userAddress,
  });

  return {
    invoices,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
