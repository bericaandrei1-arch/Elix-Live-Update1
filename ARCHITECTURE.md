# Technical Architecture Document

## 1. System Overview
`elix-star-live` is a real-time social streaming platform built on a serverless/edge architecture.

## 2. Tech Stack

### Frontend (Client)
*   **Framework**: React 18 (Vite).
*   **Language**: TypeScript.
*   **UI Library**: Tailwind CSS + Lucide React.
*   **State Management**: React Context + Hooks.

### Backend (BaaS)
*   **Database**: Supabase (PostgreSQL).
*   **Auth**: Supabase Auth (JWT).
*   **Storage**: Supabase Storage (S3 compatible).
*   **Edge Functions**: Supabase Edge Functions (Deno).

### Real-Time Infrastructure
*   **Streaming**: Agora RTC SDK (WebRTC).
*   **Signaling**: Agora RTM / Supabase Realtime (WebSockets).

### Payments
*   **Processor**: Stripe (Checkout & Connect).

## 3. Data Flow

### Authentication
1.  User signs up (Email/Phone).
2.  Supabase issues JWT.
3.  RLS (Row Level Security) policies enforce data access based on `auth.uid()`.

### Live Streaming
1.  Broadcaster joins Agora Channel (Role: Host).
2.  Viewers join Agora Channel (Role: Audience).
3.  Latency: < 400ms.

### Gifting (Transaction)
1.  Viewer clicks Gift.
2.  Client calls DB to check balance.
3.  DB Trigger deducts coins -> adds diamonds to Creator.
4.  Realtime subscription updates UI for everyone.

## 4. Security Model
*   **Zero Trust**: Client is untrusted. All writes verified by RLS policies.
*   **Keys**: Public keys exposed safely. Secret keys (Service Role, Stripe Secret) stored in Env Vars on Server/Edge only.

## 5. Scalability
*   **Horizontal**: Frontend on CDN (Unlimited). Backend scales via Supabase Compute Add-ons.
*   **Vertical**: Agora handles video scaling (Global Edge Network).
