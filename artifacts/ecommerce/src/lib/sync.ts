/**
 * sync.ts
 * Utility for Real-time MySQL VPS Synchronization
 */

const API_BASE = "/api";

export const syncUserToVPS = async (user: any) => {
  try {
    const res = await fetch(`${API_BASE}/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncProductToVPS = async (product: any) => {
  try {
    const res = await fetch(`${API_BASE}/products/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncOrderToVPS = async (order: any) => {
  try {
    const res = await fetch(`${API_BASE}/orders/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncReviewToVPS = async (review: any) => {
  try {
    const res = await fetch(`${API_BASE}/reviews/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncAuctionToVPS = async (auction: any) => {
  try {
    const res = await fetch(`${API_BASE}/auctions/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auction)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncPollToVPS = async (poll: any) => {
  try {
    const res = await fetch(`${API_BASE}/polls/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poll)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncTicketToVPS = async (ticket: any) => {
  try {
    const res = await fetch(`${API_BASE}/tickets/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncVoucherToVPS = async (voucher: any) => {
  try {
    const res = await fetch(`${API_BASE}/vouchers/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voucher)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const syncRedeemCodeToVPS = async (code: any) => {
  try {
    const res = await fetch(`${API_BASE}/redeem-codes/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(code)
    });
    return res.ok;
  } catch (error) { return false; }
};

export const fetchAllUsersFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllProductsFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const deleteProductFromVPS = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (error) { }
  return false;
};

export const fetchAllOrdersFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllReviewsFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllAuctionsFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/auctions`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllPollsFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/polls`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllTicketsFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/tickets`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllVouchersFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/vouchers`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};

export const fetchAllRedeemCodesFromVPS = async () => {
  try {
    const res = await fetch(`${API_BASE}/redeem-codes`);
    if (res.ok) return await res.json();
  } catch (error) { }
  return null;
};
