# Yellow Invoice

On-chain invoicing powered by [Yellow Network](https://yellow.com) state channels for instant, off-chain payments. Create invoices stored on Base Sepolia, pay them instantly through ERC-7824 state channels, and manage your business with a full-featured dashboard — all with `.yellow.eth` ENS identity.

## Features

- **On-Chain Invoices** — Create and store invoices on Base Sepolia with line items, due dates, and payment terms.
- **Instant Payments** — Pay invoices through Yellow Network state channels (off-chain, near-instant settlement via [Nitrolite](https://github.com/erc7824/nitrolite)).
- **Dashboard** — Monthly revenue stats, top clients, pay-in/pay-out charts, and wallet + ledger balances at a glance.
- **ENS Subnames** — Register a `.yellow.eth` subname on Base Sepolia as your on-chain identity.
- **Embedded Wallets** — Sign in with email or Google via [Privy](https://privy.io) — no browser extension required.
- **Multi-Chain Support** — Sepolia, Base Sepolia, and Polygon Amoy supported through Yellow Network.

## Architecture

```
yellow-invoice/
├── contracts/          # Foundry smart contracts (Solidity)
│   ├── src/
│   │   ├── YellowInvoice.sol      # Invoice creation & settlement
│   │   └── YellowL2Registrar.sol  # ENS subname registrar (L2)
│   ├── script/         # Deployment scripts
│   ├── test/           # Contract tests
│   └── lib/            # Dependencies (OpenZeppelin, Durin, ENS)
│
└── frontend/           # Next.js 16 app (App Router)
    └── src/
        ├── app/
        │   ├── (dashboard)/
        │   │   ├── page.tsx              # Dashboard (stats, charts, balances)
        │   │   ├── invoicing/page.tsx    # Invoice list & creation
        │   │   └── pay/[invoiceId]/      # Payment page
        │   ├── settle/[id]/              # Invoice settlement page
        │   └── settings/                 # Profile & ENS settings
        ├── components/       # UI components (shadcn/ui + Radix)
        ├── hooks/            # Custom React hooks
        ├── constants/        # Addresses, ABIs, chain config
        └── providers/        # Privy, Wagmi, QueryClient providers
```

### Smart Contracts

| Contract | Purpose | Network |
|---|---|---|
| **YellowInvoice** | `createInvoice()`, `markPaid()`, `getInvoice()` — on-chain invoice lifecycle | Base Sepolia |
| **YellowL2Registrar** | `.yellow.eth` ENS subname registration via Durin | Base Sepolia |

Invoice data is indexed by a [Graph subgraph](https://thegraph.com) for efficient querying.

### Payment Flow

```
┌──────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Sender  │────>│  Yellow Network  │────>│  Recipient        │
│  (Payer) │     │  State Channel   │     │  (Invoice Owner)  │
└──────────┘     │  (ERC-7824)      │     └───────────────────┘
                 └──────────────────┘
                         │
                         v
                 ┌──────────────────┐
                 │  Base Sepolia    │
                 │  (on-chain       │
                 │   settlement)    │
                 └──────────────────┘
```

1. Payer connects wallet (Privy embedded or injected).
2. Authenticates with Yellow Network via WebSocket + EIP-712 signature.
3. Deposits `ytest.usd` tokens to the ledger (if needed).
4. Sends payment via direct transfer through the state channel.
5. Payment settles instantly off-chain; invoice is marked paid on-chain.

### Frontend Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS 4, Framer Motion |
| UI Library | shadcn/ui (Radix UI primitives) |
| Auth & Wallets | Privy (email, Google, embedded wallets) |
| Ethereum | Viem, Wagmi |
| State Channels | yellow-ts SDK, @erc7824/nitrolite |
| Data | The Graph (GraphQL subgraph), TanStack Query |
| Icons | Tabler Icons, Lucide React |

### Key Hooks

| Hook | Responsibility |
|---|---|
| `useYellowChannel` | Yellow Network WebSocket connection, state channel lifecycle |
| `useInvoiceContract` | Read/write interactions with `YellowInvoice` contract |
| `useInvoicePayment` | End-to-end payment flow orchestration |
| `useUserInvoices` | Fetch invoices from The Graph subgraph |
| `useEns` | `.yellow.eth` subname registration & resolution |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contracts)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Contracts

```bash
cd contracts
forge build
forge test
```

## Deployments (Testnet)

| Contract | Address | Network |
|---|---|---|
| YellowInvoice | `0x4d04160633223533db789aab6610f54028295956` | Base Sepolia |
| YellowL2Registrar | `0x2F1f83A5802e24Cae6cb835406Fc71946231D97E` | Base Sepolia |
| ytest.usd Token | `0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb` | Base Sepolia |

## License

MIT
