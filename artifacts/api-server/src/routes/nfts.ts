import { Router } from "express";
import { db } from "@workspace/db";
import { users, nfts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Helper to log actions inside users table JSON activityLog
async function logUserActivity(userId: string, action: string) {
  try {
    const userRows = await db.select({ activityLog: users.activityLog }).from(users).where(eq(users.id, userId));
    if (userRows.length > 0) {
      let logs: any[] = [];
      const rawLog = userRows[0].activityLog;
      if (rawLog) {
        if (typeof rawLog === "string") {
          try { logs = JSON.parse(rawLog); } catch { logs = []; }
        } else if (Array.isArray(rawLog)) {
          logs = rawLog;
        }
      }
      logs.unshift({ action, timestamp: new Date().toISOString() });
      await db.update(users).set({ activityLog: logs }).where(eq(users.id, userId));
    }
  } catch (error) {
    console.error(`[LOG USER ACTIVITY ERROR]`, error);
  }
}

// Helper to log wallet transactions inside users table JSON walletTransactions
async function logWalletTransaction(userId: string, tx: { type: "topup" | "payment"; amount: number; description: string; recipientId?: string; recipientName?: string; senderId?: string; senderName?: string }) {
  try {
    const userRows = await db.select({ walletTransactions: users.walletTransactions }).from(users).where(eq(users.id, userId));
    if (userRows.length > 0) {
      let txs: any[] = [];
      const rawTxs = userRows[0].walletTransactions;
      if (rawTxs) {
        if (typeof rawTxs === "string") {
          try { txs = JSON.parse(rawTxs); } catch { txs = []; }
        } else if (Array.isArray(rawTxs)) {
          txs = rawTxs;
        }
      }
      const newTx = {
        id: Math.random().toString(36).substring(2, 11),
        date: new Date().toISOString(),
        ...tx,
      };
      txs.unshift(newTx);
      await db.update(users).set({ walletTransactions: txs }).where(eq(users.id, userId));
    }
  } catch (error) {
    console.error(`[LOG WALLET TRANSACTION ERROR]`, error);
  }
}

// ─── GET ALL NFTS ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const allNfts = await db.select().from(nfts);
    res.json(allNfts);
  } catch (error: any) {
    console.error("[GET NFTS ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY NFT WITH MYCOINNFT ───────────────────────────────────────────────
router.post("/:id/buy", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID wajib diisi" });
    }

    // 1. Fetch NFT
    const nftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));
    if (nftRows.length === 0) {
      return res.status(404).json({ error: "NFT tidak ditemukan" });
    }
    const nft = nftRows[0];

    if (!nft.isForSale) {
      return res.status(400).json({ error: "NFT ini tidak sedang dijual" });
    }

    if (nft.ownerId === userId) {
      return res.status(400).json({ error: "Anda sudah memiliki NFT ini" });
    }

    // 2. Fetch Buyer
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const buyer = userRows[0];

    const priceMcnft = Number(nft.priceMcnft || 0);
    const buyerMcnft = Number(buyer.myCoinNft || 0);

    if (buyerMcnft < priceMcnft) {
      return res.status(400).json({
        error: `Saldo MyCoinNFT tidak mencukupi. Butuh ${priceMcnft} MCNFT, saldo Anda ${buyerMcnft} MCNFT`
      });
    }

    // 3. Deduct buyer balance & update NFT ownership
    const updatedBuyerMcnft = buyerMcnft - priceMcnft;
    await db.update(users)
      .set({ myCoinNft: String(updatedBuyerMcnft) })
      .where(eq(users.id, userId));

    const oldOwnerId = nft.ownerId;

    await db.update(nfts)
      .set({
        ownerId: userId,
        isForSale: false
      })
      .where(eq(nfts.id, Number(id)));

    // 4. Pay previous owner if it was a real user
    if (oldOwnerId && oldOwnerId !== "market") {
      const sellerRows = await db.select().from(users).where(eq(users.id, oldOwnerId));
      if (sellerRows.length > 0) {
        const seller = sellerRows[0];
        const updatedSellerMcnft = Number(seller.myCoinNft || 0) + priceMcnft;
        await db.update(users)
          .set({ myCoinNft: String(updatedSellerMcnft) })
          .where(eq(users.id, oldOwnerId));

        await logUserActivity(oldOwnerId, `NFT Sold: "${nft.name}" seharga ${priceMcnft} MCNFT`);
      }
    }

    // 5. Activity logs
    await logUserActivity(userId, `NFT Purchased: "${nft.name}" seharga ${priceMcnft} MCNFT`);

    // Fetch updated user to return
    const finalBuyerRows = await db.select().from(users).where(eq(users.id, userId));
    const finalNftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));

    res.json({
      success: true,
      message: `Berhasil membeli NFT "${nft.name}"!`,
      user: finalBuyerRows[0],
      nft: finalNftRows[0]
    });
  } catch (error: any) {
    console.error("[BUY NFT ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY NFT WITH RUPIAH ──────────────────────────────────────────────────
router.post("/:id/buy-rupiah", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID wajib diisi" });
    }

    // 1. Fetch NFT
    const nftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));
    if (nftRows.length === 0) {
      return res.status(404).json({ error: "NFT tidak ditemukan" });
    }
    const nft = nftRows[0];

    if (!nft.isForSale) {
      return res.status(400).json({ error: "NFT ini tidak sedang dijual" });
    }

    if (nft.ownerId === userId) {
      return res.status(400).json({ error: "Anda sudah memiliki NFT ini" });
    }

    // 2. Fetch Buyer
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const buyer = userRows[0];

    const priceMcnft = Number(nft.priceMcnft || 0);
    const priceRupiah = priceMcnft * 1000000;
    const buyerBalance = Number(buyer.balance || 0);

    if (buyerBalance < priceRupiah) {
      return res.status(400).json({
        error: `Saldo MyDompet tidak mencukupi. Butuh Rp ${priceRupiah.toLocaleString('id-ID')}, saldo Anda Rp ${buyerBalance.toLocaleString('id-ID')}`
      });
    }

    // 3. Deduct buyer balance & update NFT ownership
    const updatedBuyerBalance = buyerBalance - priceRupiah;
    await db.update(users)
      .set({ balance: String(updatedBuyerBalance) })
      .where(eq(users.id, userId));

    const oldOwnerId = nft.ownerId;

    await db.update(nfts)
      .set({
        ownerId: userId,
        isForSale: false
      })
      .where(eq(nfts.id, Number(id)));

    // 4. Pay previous owner in MCNFT
    if (oldOwnerId && oldOwnerId !== "market") {
      const sellerRows = await db.select().from(users).where(eq(users.id, oldOwnerId));
      if (sellerRows.length > 0) {
        const seller = sellerRows[0];
        const updatedSellerMcnft = Number(seller.myCoinNft || 0) + priceMcnft;
        await db.update(users)
          .set({ myCoinNft: String(updatedSellerMcnft) })
          .where(eq(users.id, oldOwnerId));

        await logUserActivity(oldOwnerId, `NFT Sold: "${nft.name}" seharga ${priceMcnft} MCNFT (Rupiah Purchase)`);
      }
    }

    // 5. Activity & Wallet Logs
    await logWalletTransaction(userId, {
      type: "payment",
      amount: -priceRupiah,
      description: `Beli NFT "${nft.name}" via MyDompet`
    });

    await logUserActivity(userId, `NFT Purchased: "${nft.name}" seharga Rp ${priceRupiah.toLocaleString('id-ID')}`);

    const finalBuyerRows = await db.select().from(users).where(eq(users.id, userId));
    const finalNftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));

    res.json({
      success: true,
      message: `Berhasil membeli NFT "${nft.name}" seharga Rp ${priceRupiah.toLocaleString('id-ID')}!`,
      user: finalBuyerRows[0],
      nft: finalNftRows[0]
    });
  } catch (error: any) {
    console.error("[BUY NFT RUPIAH ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY NFT WITH CRYPTO DIRECT ───────────────────────────────────────────
router.post("/:id/buy-crypto-direct", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID wajib diisi" });
    }

    // 1. Fetch NFT
    const nftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));
    if (nftRows.length === 0) {
      return res.status(404).json({ error: "NFT tidak ditemukan" });
    }
    const nft = nftRows[0];

    if (!nft.isForSale) {
      return res.status(400).json({ error: "NFT ini tidak sedang dijual" });
    }

    if (nft.ownerId === userId) {
      return res.status(400).json({ error: "Anda sudah memiliki NFT ini" });
    }

    // 2. Fetch Buyer
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const buyer = userRows[0];

    const priceCrypto = Number(nft.priceCrypto || 0);
    const cryptoType = (nft.cryptoType || "USDT").toUpperCase();

    let currentCryptoBalance = 0;
    let newCryptoBalance = 0;

    if (cryptoType === "BTC") {
      currentCryptoBalance = Number(buyer.balanceBtc || 0);
    } else if (cryptoType === "ETH") {
      currentCryptoBalance = Number(buyer.balanceEth || 0);
    } else if (cryptoType === "USDT") {
      currentCryptoBalance = Number(buyer.balanceUsdt || 0);
    } else {
      return res.status(400).json({ error: `Tipe cryptocurrency "${cryptoType}" tidak didukung` });
    }

    if (currentCryptoBalance < priceCrypto) {
      return res.status(400).json({
        error: `Saldo ${cryptoType} tidak mencukupi. Butuh ${priceCrypto} ${cryptoType}, saldo Anda ${currentCryptoBalance} ${cryptoType}`
      });
    }

    newCryptoBalance = currentCryptoBalance - priceCrypto;

    // 3. Deduct buyer crypto balance & update NFT ownership
    const updates: any = {};
    if (cryptoType === "BTC") {
      updates.balanceBtc = String(newCryptoBalance.toFixed(6));
    } else if (cryptoType === "ETH") {
      updates.balanceEth = String(newCryptoBalance.toFixed(6));
    } else if (cryptoType === "USDT") {
      updates.balanceUsdt = String(newCryptoBalance.toFixed(2));
    }

    await db.update(users)
      .set(updates)
      .where(eq(users.id, userId));

    const oldOwnerId = nft.ownerId;
    const priceMcnft = Number(nft.priceMcnft || 0);

    await db.update(nfts)
      .set({
        ownerId: userId,
        isForSale: false
      })
      .where(eq(nfts.id, Number(id)));

    // 4. Pay previous owner in MCNFT
    if (oldOwnerId && oldOwnerId !== "market") {
      const sellerRows = await db.select().from(users).where(eq(users.id, oldOwnerId));
      if (sellerRows.length > 0) {
        const seller = sellerRows[0];
        const updatedSellerMcnft = Number(seller.myCoinNft || 0) + priceMcnft;
        await db.update(users)
          .set({ myCoinNft: String(updatedSellerMcnft) })
          .where(eq(users.id, oldOwnerId));

        await logUserActivity(oldOwnerId, `NFT Sold: "${nft.name}" seharga ${priceMcnft} MCNFT (Crypto Purchase)`);
      }
    }

    // 5. Activity logs
    await logUserActivity(userId, `NFT Purchased: "${nft.name}" seharga ${priceCrypto} ${cryptoType}`);

    const finalBuyerRows = await db.select().from(users).where(eq(users.id, userId));
    const finalNftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));

    res.json({
      success: true,
      message: `Berhasil membeli NFT "${nft.name}" seharga ${priceCrypto} ${cryptoType}!`,
      user: finalBuyerRows[0],
      nft: finalNftRows[0]
    });
  } catch (error: any) {
    console.error("[BUY NFT CRYPTO ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── MCNFT FAUCET FOR TESTING ────────────────────────────────────────────
router.post("/faucet", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID wajib diisi" });
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const user = userRows[0];

    const currentMcnft = Number(user.myCoinNft || 0);
    const updatedMcnft = currentMcnft + 500;

    await db.update(users)
      .set({ myCoinNft: String(updatedMcnft) })
      .where(eq(users.id, userId));

    await logUserActivity(userId, `Faucet Claimed: Menerima 500 MyCoinNFT gratis untuk testing`);

    const finalUserRows = await db.select().from(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: "Berhasil mengklaim 500 MyCoinNFT dari faucet!",
      user: finalUserRows[0]
    });
  } catch (error: any) {
    console.error("[FAUCET ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SELL NFT FOR MYCOINNFT ──────────────────────────────────────────────
router.post("/:id/sell", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID wajib diisi" });
    }

    // 1. Fetch NFT
    const nftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));
    if (nftRows.length === 0) {
      return res.status(404).json({ error: "NFT tidak ditemukan" });
    }
    const nft = nftRows[0];

    if (nft.ownerId !== userId) {
      return res.status(403).json({ error: "Anda bukan pemilik NFT ini" });
    }

    // 2. Fetch Seller
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const seller = userRows[0];

    const priceMcnft = Number(nft.priceMcnft || 0);
    const sellerMcnft = Number(seller.myCoinNft || 0);

    // 3. Update seller's MyCoinNFT and set NFT back to sale on market
    const updatedSellerMcnft = sellerMcnft + priceMcnft;
    await db.update(users)
      .set({ myCoinNft: String(updatedSellerMcnft) })
      .where(eq(users.id, userId));

    await db.update(nfts)
      .set({
        ownerId: null, // Market owned
        isForSale: true
      })
      .where(eq(nfts.id, Number(id)));

    // 4. Log activity
    await logUserActivity(userId, `NFT Resold to Market: "${nft.name}" seharga ${priceMcnft} MCNFT`);

    // Fetch updated data
    const finalSellerRows = await db.select().from(users).where(eq(users.id, userId));
    const finalNftRows = await db.select().from(nfts).where(eq(nfts.id, Number(id)));

    res.json({
      success: true,
      message: `Berhasil mengembalikan NFT "${nft.name}" ke pasar seharga ${priceMcnft} MCNFT!`,
      user: finalSellerRows[0],
      nft: finalNftRows[0]
    });
  } catch (error: any) {
    console.error("[SELL NFT ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SWAP SIMULATED CRYPTO FOR MYCOINNFT ─────────────────────────────────
router.post("/swap-crypto", async (req, res) => {
  try {
    const { userId, cryptoType, amount } = req.body;
    if (!userId || !cryptoType || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Data swap tidak valid" });
    }

    const swapAmount = Number(amount);

    // 1. Fetch User
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const user = userRows[0];

    let currentCryptoBalance = 0;
    let newCryptoBalance = 0;
    let mcnftGained = 0;

    const normalizedCrypto = cryptoType.toUpperCase();

    // Rates: 1 BTC = 1000 MCNFT | 1 ETH = 50 MCNFT | 1 USDT = 1 MCNFT
    if (normalizedCrypto === "BTC") {
      currentCryptoBalance = Number(user.balanceBtc || 0);
      if (currentCryptoBalance < swapAmount) {
        return res.status(400).json({ error: `Saldo BTC tidak cukup. Butuh ${swapAmount} BTC, saldo Anda ${currentCryptoBalance} BTC` });
      }
      newCryptoBalance = currentCryptoBalance - swapAmount;
      mcnftGained = swapAmount * 1000;
    } else if (normalizedCrypto === "ETH") {
      currentCryptoBalance = Number(user.balanceEth || 0);
      if (currentCryptoBalance < swapAmount) {
        return res.status(400).json({ error: `Saldo ETH tidak cukup. Butuh ${swapAmount} ETH, saldo Anda ${currentCryptoBalance} ETH` });
      }
      newCryptoBalance = currentCryptoBalance - swapAmount;
      mcnftGained = swapAmount * 50;
    } else if (normalizedCrypto === "USDT") {
      currentCryptoBalance = Number(user.balanceUsdt || 0);
      if (currentCryptoBalance < swapAmount) {
        return res.status(400).json({ error: `Saldo USDT tidak cukup. Butuh ${swapAmount} USDT, saldo Anda ${currentCryptoBalance} USDT` });
      }
      newCryptoBalance = currentCryptoBalance - swapAmount;
      mcnftGained = swapAmount * 1;
    } else {
      return res.status(400).json({ error: "Tipe cryptocurrency tidak didukung" });
    }

    const updatedMcnft = Number(user.myCoinNft || 0) + mcnftGained;

    // 2. Perform updates
    const updates: any = { myCoinNft: String(updatedMcnft) };
    if (normalizedCrypto === "BTC") updates.balanceBtc = String(newCryptoBalance.toFixed(6));
    else if (normalizedCrypto === "ETH") updates.balanceEth = String(newCryptoBalance.toFixed(6));
    else if (normalizedCrypto === "USDT") updates.balanceUsdt = String(newCryptoBalance.toFixed(2));

    await db.update(users).set(updates).where(eq(users.id, userId));

    // 3. Log user activity
    await logUserActivity(userId, `Crypto Swap: Menukar ${swapAmount} ${normalizedCrypto} menjadi ${mcnftGained} MyCoinNFT`);

    // Fetch updated user to return
    const finalUserRows = await db.select().from(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: `Berhasil menukar ${swapAmount} ${normalizedCrypto} menjadi ${mcnftGained} MyCoinNFT!`,
      user: finalUserRows[0]
    });
  } catch (error: any) {
    console.error("[SWAP CRYPTO ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── BUY SIMULATED CRYPTO WITH MYDOMPET WALLET BALANCE ────────────────────
router.post("/buy-crypto", async (req, res) => {
  try {
    const { userId, cryptoType, amount } = req.body;
    if (!userId || !cryptoType || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Data pembelian tidak valid" });
    }

    const buyAmount = Number(amount);
    const normalizedCrypto = cryptoType.toUpperCase();

    // Simulated Market Rates in Rupiah:
    // 1 BTC = Rp 1.000.000.000
    // 1 ETH = Rp 50.000.000
    // 1 USDT = Rp 15.000
    let rate = 0;
    if (normalizedCrypto === "BTC") rate = 1000000000;
    else if (normalizedCrypto === "ETH") rate = 50000000;
    else if (normalizedCrypto === "USDT") rate = 15000;
    else {
      return res.status(400).json({ error: "Tipe cryptocurrency tidak didukung" });
    }

    const totalCost = buyAmount * rate;

    // 1. Fetch User
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const user = userRows[0];

    const currentWalletBalance = Number(user.balance || 0);
    if (currentWalletBalance < totalCost) {
      return res.status(400).json({
        error: `Saldo MyDompet tidak mencukupi. Butuh Rp ${totalCost.toLocaleString('id-ID')}, saldo Anda Rp ${currentWalletBalance.toLocaleString('id-ID')}`
      });
    }

    // 2. Perform updates
    const newWalletBalance = currentWalletBalance - totalCost;
    const updates: any = { balance: String(newWalletBalance) };

    if (normalizedCrypto === "BTC") {
      updates.balanceBtc = String((Number(user.balanceBtc || 0) + buyAmount).toFixed(6));
    } else if (normalizedCrypto === "ETH") {
      updates.balanceEth = String((Number(user.balanceEth || 0) + buyAmount).toFixed(6));
    } else if (normalizedCrypto === "USDT") {
      updates.balanceUsdt = String((Number(user.balanceUsdt || 0) + buyAmount).toFixed(2));
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    // 3. Logs & Transactions
    await logWalletTransaction(userId, {
      type: "payment",
      amount: -totalCost,
      description: `Beli ${buyAmount} ${normalizedCrypto} via MyDompet`
    });

    await logUserActivity(userId, `Crypto Purchased: Beli ${buyAmount} ${normalizedCrypto} seharga Rp ${totalCost.toLocaleString('id-ID')}`);

    // Fetch updated user to return
    const finalUserRows = await db.select().from(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: `Berhasil membeli ${buyAmount} ${normalizedCrypto} seharga Rp ${totalCost.toLocaleString('id-ID')}!`,
      user: finalUserRows[0]
    });
  } catch (error: any) {
    console.error("[BUY CRYPTO ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── CASH OUT MYCOINNFT INTO MYDOMPET WALLET BALANCE ─────────────────────
router.post("/swap-mcnft-to-wallet", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Data penukaran tidak valid" });
    }

    const swapAmount = Number(amount);

    // 1. Fetch User
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const user = userRows[0];

    const currentMcnft = Number(user.myCoinNft || 0);
    if (currentMcnft < swapAmount) {
      return res.status(400).json({
        error: `Saldo MyCoinNFT tidak mencukupi. Butuh ${swapAmount} MCNFT, saldo Anda ${currentMcnft} MCNFT`
      });
    }

    // Rate: 1 MCNFT = Rp 1.000.000
    const rupiahGained = swapAmount * 1000000;

    const newMcnft = currentMcnft - swapAmount;
    const newWalletBalance = Number(user.balance || 0) + rupiahGained;

    // 2. Perform updates
    await db.update(users)
      .set({
        myCoinNft: String(newMcnft),
        balance: String(newWalletBalance)
      })
      .where(eq(users.id, userId));

    // 3. Logs & Transactions
    await logWalletTransaction(userId, {
      type: "topup",
      amount: rupiahGained,
      description: `Refill MyDompet dari Swap ${swapAmount} MyCoinNFT`
    });

    await logUserActivity(userId, `Cash Out MCNFT: Menukar ${swapAmount} MyCoinNFT menjadi Saldo MyDompet sebesar Rp ${rupiahGained.toLocaleString('id-ID')}`);

    // Fetch updated user to return
    const finalUserRows = await db.select().from(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: `Berhasil mencairkan ${swapAmount} MyCoinNFT menjadi Rp ${rupiahGained.toLocaleString('id-ID')} ke dompet saldo Anda!`,
      user: finalUserRows[0]
    });
  } catch (error: any) {
    console.error("[CASH OUT MCNFT ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── NFT GACHA LUCKY MINT ────────────────────────────────────────────────
router.post("/gacha", async (req, res) => {
  try {
    const { userId, paymentMethod } = req.body;
    if (!userId || !paymentMethod) {
      return res.status(400).json({ error: "User ID dan metode pembayaran wajib diisi" });
    }

    if (!["mcnft", "coins", "wallet"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Metode pembayaran tidak valid" });
    }

    // 1. Fetch User
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    const user = userRows[0];

    // Costs
    const MCNFT_COST = 30;
    const COINS_COST = 30000;
    const WALLET_COST = 30000000;

    let updatedMyCoinNft = Number(user.myCoinNft || 0);
    let updatedCoins = Number(user.coins || 0);
    let updatedBalance = Number(user.balance || 0);

    // Deduct payments
    if (paymentMethod === "mcnft") {
      if (updatedMyCoinNft < MCNFT_COST) {
        return res.status(400).json({ error: `Saldo MyCoinNFT tidak mencukupi. Butuh ${MCNFT_COST} MCNFT, saldo Anda ${updatedMyCoinNft} MCNFT` });
      }
      updatedMyCoinNft -= MCNFT_COST;
    } else if (paymentMethod === "coins") {
      if (updatedCoins < COINS_COST) {
        return res.status(400).json({ error: `Saldo Elite Coins tidak mencukupi. Butuh ${COINS_COST.toLocaleString('id-ID')} Coins, saldo Anda ${updatedCoins.toLocaleString('id-ID')} Coins` });
      }
      updatedCoins -= COINS_COST;
    } else if (paymentMethod === "wallet") {
      if (updatedBalance < WALLET_COST) {
        return res.status(400).json({ error: `Saldo MyDompet tidak mencukupi. Butuh Rp ${WALLET_COST.toLocaleString('id-ID')}, saldo Anda Rp ${updatedBalance.toLocaleString('id-ID')}` });
      }
      updatedBalance -= WALLET_COST;
    }

    // 2. Roll a weighted random NFT
    // Tiers: Common 60%, Rare 30%, Epic 8%, Legendary 2%
    const gachaPool = {
      common: [
        {
          name: "Cyber Junk #08",
          description: "Sebuah potongan sisa sirkuit cyber kuno dari era pra-grid.",
          image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop",
          priceCrypto: "10.00",
          cryptoType: "USDT",
          priceMcnft: "10"
        },
        {
          name: "Grid Neon Dust",
          description: "Debu foton sisa pertempuran laser sengit di arena grid TokoArthur.",
          image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop",
          priceCrypto: "8.00",
          cryptoType: "USDT",
          priceMcnft: "8"
        },
        {
          name: "Auth Keycard V1",
          description: "Kartu akses level rendah terenkripsi yang sudah didekompilasi.",
          image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=500&auto=format&fit=crop",
          priceCrypto: "15.00",
          cryptoType: "USDT",
          priceMcnft: "15"
        }
      ],
      rare: [
        {
          name: "Arthur Vanguard Shield",
          description: "Tameng pertahanan infanteri cyber tangguh dari divisi Ksatria Arthur.",
          image: "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=500&auto=format&fit=crop",
          priceCrypto: "0.20",
          cryptoType: "ETH",
          priceMcnft: "10"
        },
        {
          name: "Cynmatic Code Breaker",
          description: "Perangkat lunak portabel mutakhir untuk memecahkan enkripsi blok dasar.",
          image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop",
          priceCrypto: "0.30",
          cryptoType: "ETH",
          priceMcnft: "15"
        },
        {
          name: "Holographic Visor",
          description: "Kacamata taktis bersensor tinggi untuk mendeteksi anomali rantai blok.",
          image: "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&auto=format&fit=crop",
          priceCrypto: "0.40",
          cryptoType: "ETH",
          priceMcnft: "20"
        }
      ],
      epic: [
        {
          name: "Quantum Flux Core",
          description: "Inti energi berosilasi tinggi yang berfungsi menstabilkan VIP Blockchain Nodes.",
          image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=500&auto=format&fit=crop",
          priceCrypto: "1.20",
          cryptoType: "ETH",
          priceMcnft: "60"
        },
        {
          name: "Hyperion Laser Sabre",
          description: "Pedang energi murni beresonansi tinggi milik panglima perang Neo-Arthur.",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop",
          priceCrypto: "0.08",
          cryptoType: "BTC",
          priceMcnft: "80"
        }
      ],
      legendary: [
        {
          name: "Antigravity Devourer Node",
          description: "Node maha dahsyat yang mampu menyerap seluruh data grid tanpa terdeteksi.",
          image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop",
          priceCrypto: "0.50",
          cryptoType: "BTC",
          priceMcnft: "500"
        },
        {
          name: "Cynmatic Genesis Crown",
          description: "Mahkota algoritma genesis yang memberikan kekuasaan mutlak di TokoArthur.",
          image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&auto=format&fit=crop",
          priceCrypto: "1.00",
          cryptoType: "BTC",
          priceMcnft: "1000"
        }
      ]
    };

    const roll = Math.random() * 100;
    let selectedTier: "common" | "rare" | "epic" | "legendary" = "common";
    if (roll < 2) {
      selectedTier = "legendary";
    } else if (roll < 10) {
      selectedTier = "epic";
    } else if (roll < 40) {
      selectedTier = "rare";
    } else {
      selectedTier = "common";
    }

    const itemsOfTier = gachaPool[selectedTier];
    const rolledItem = itemsOfTier[Math.floor(Math.random() * itemsOfTier.length)];

    // 3. Update user balances in DB
    const updates: any = {};
    if (paymentMethod === "mcnft") {
      updates.myCoinNft = String(updatedMyCoinNft);
    } else if (paymentMethod === "coins") {
      updates.coins = updatedCoins;
    } else if (paymentMethod === "wallet") {
      updates.balance = String(updatedBalance);
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    // 4. Insert newly generated NFT into database
    const insertResult = await db.insert(nfts).values({
      name: `[${selectedTier.toUpperCase()}] ${rolledItem.name}`,
      description: rolledItem.description,
      image: rolledItem.image,
      priceCrypto: rolledItem.priceCrypto,
      cryptoType: rolledItem.cryptoType,
      priceMcnft: rolledItem.priceMcnft,
      ownerId: userId,
      isForSale: false,
    });

    // Extract newly inserted ID
    const newNftId = insertResult[0].insertId;

    // Logging & Transaction receipts
    let costText = "";
    if (paymentMethod === "mcnft") costText = "30 MCNFT";
    else if (paymentMethod === "coins") costText = "30.000 Coins";
    else if (paymentMethod === "wallet") costText = "Rp 30.000.000";

    await logUserActivity(userId, `Gacha Spin: Mendapatkan [${selectedTier.toUpperCase()}] ${rolledItem.name} seharga ${costText}`);

    if (paymentMethod === "wallet") {
      await logWalletTransaction(userId, {
        type: "payment",
        amount: -WALLET_COST,
        description: `Draw NFT Gacha via MyDompet`
      });
    }

    // Fetch updated user & NFT
    const finalUserRows = await db.select().from(users).where(eq(users.id, userId));
    const finalNftRows = await db.select().from(nfts).where(eq(nfts.id, Number(newNftId)));

    res.json({
      success: true,
      message: `Selamat! Anda berhasil me-minting [${selectedTier.toUpperCase()}] ${rolledItem.name}!`,
      user: finalUserRows[0],
      nft: finalNftRows[0],
      tier: selectedTier
    });
  } catch (error: any) {
    console.error("[GACHA MINT ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
