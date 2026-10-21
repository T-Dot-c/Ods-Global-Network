/**
 * ODS Global Network — Gift Card & Voucher Service
 *
 * Implements cryptographic claim code generation, SHA-256 hash lookup,
 * atomic double-spend locking, digital wallet ledger updates, and
 * provider fulfillment confirmations.
 */
'use strict';

const crypto = require('crypto');
const pool = require('../db');

// Safe Base32 alphabet omitting visually ambiguous characters (0, O, 1, I, L)
const SAFE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure 16-character claim code formatted as ODS-GC-XXXX-XXXX
 */
function generateClaimCode() {
  const bytes = crypto.randomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }
  return `ODS-GC-${result.slice(0, 4)}-${result.slice(4, 8)}`;
}

/**
 * Normalize and compute SHA-256 hash of claim code for secure indexing
 */
function hashClaimCode(code) {
  if (!code || typeof code !== 'string') return '';
  const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Purchase a new gift card / voucher
 */
async function purchaseGiftCard({
  senderId,
  amount,
  currency = 'ETB',
  packageType = 'custom',
  occasion = 'general',
  giftType = 'monetary',
  serviceTitle = null,
  serviceCategory = null,
  serviceProviderId = null,
  recipientName = null,
  recipientEmail = null,
  recipientPhone = null,
  personalMessage = null,
  scheduledDeliveryDate = null,
  status = 'active',
  expiryMonths = 12,
  metadata = {},
}) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Gift card amount must be a positive number.');
  }

  const cleanCurrency = String(currency || 'ETB').trim().toUpperCase().slice(0, 3);
  const cleanPackage = ['basic', 'vip', 'custom'].includes(packageType) ? packageType : 'custom';
  const cleanOccasion = String(occasion || 'General').trim().slice(0, 50);
  const cleanGiftType = ['monetary', 'service'].includes(giftType) ? giftType : 'monetary';

  // Calculate expiry date (default: 12 months)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + (parseInt(expiryMonths, 10) || 12));

  let claimCode = '';
  let codeHash = '';
  let attempts = 0;

  // Collision retry loop
  while (attempts < 5) {
    attempts++;
    claimCode = generateClaimCode();
    codeHash = hashClaimCode(claimCode);

    try {
      const validStatuses = ['pending_payment', 'active', 'redeemed', 'delivered', 'expired', 'cancelled', 'refunded'];
      const cardStatus = validStatuses.includes(status) ? status : 'active';
      const scheduledDate = scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : null;

      const insertRes = await pool.query(
        `INSERT INTO gift_cards (
          sender_id, code, code_hash, initial_amount, balance, currency,
          gift_type, package_type, occasion, service_title, service_category,
          service_provider_id, status, recipient_email, recipient_phone,
          recipient_name, personal_message, expiry_date, scheduled_delivery_date, metadata
        ) VALUES (
          $1, $2, $3, $4, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18, $19
        ) RETURNING *`,
        [
          senderId, claimCode, codeHash, parsedAmount, cleanCurrency,
          cleanGiftType, cleanPackage, cleanOccasion, serviceTitle, serviceCategory,
          serviceProviderId, cardStatus, recipientEmail, recipientPhone,
          recipientName, personalMessage, expiryDate, scheduledDate, JSON.stringify(metadata)
        ]
      );

      const card = insertRes.rows[0];
      return {
        id: card.id,
        code: claimCode,
        initialAmount: parseFloat(card.initial_amount),
        balance: parseFloat(card.balance),
        currency: card.currency,
        giftType: card.gift_type,
        packageType: card.package_type,
        occasion: card.occasion,
        serviceTitle: card.service_title,
        serviceCategory: card.service_category,
        serviceProviderId: card.service_provider_id,
        recipientEmail: card.recipient_email,
        recipientName: card.recipient_name,
        recipientPhone: card.recipient_phone,
        personalMessage: card.personal_message,
        expiryDate: card.expiry_date,
        createdAt: card.created_at,
        status: card.status,
      };
    } catch (err) {
      if (err.code === '23505' && attempts < 5) {
        // Unique collision on code, retry
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate unique gift card code. Please try again.');
}

/**
 * Check gift card validity without revealing sender PII
 */
async function checkGiftCard(rawCode) {
  const codeHash = hashClaimCode(rawCode);
  if (!codeHash) {
    return { valid: false, reason: 'Please enter a valid gift card code.' };
  }

  const res = await pool.query(
    `SELECT id, initial_amount, balance, currency, gift_type, package_type,
            occasion, service_title, service_category, status, expiry_date
     FROM gift_cards
     WHERE code_hash = $1`,
    [codeHash]
  );

  if (res.rows.length === 0) {
    return { valid: false, reason: 'Invalid or unrecognized gift card code.' };
  }

  const card = res.rows[0];

  if (card.status === 'pending_payment') {
    return { valid: false, reason: 'This gift card is awaiting payment confirmation.' };
  }

  if (card.status === 'redeemed' || card.status === 'delivered') {
    return { valid: false, reason: 'This gift card has already been redeemed.' };
  }

  if (card.status === 'cancelled') {
    return { valid: false, reason: 'This gift card has been cancelled.' };
  }

  if (card.status === 'refunded') {
    return { valid: false, reason: 'This gift card has been refunded.' };
  }

  const now = new Date();
  if (new Date(card.expiry_date) <= now || card.status === 'expired') {
    return { valid: false, reason: 'This gift card has expired.' };
  }

  if (card.status !== 'active') {
    return { valid: false, reason: `This gift card is ${card.status}.` };
  }

  return {
    valid: true,
    initialAmount: parseFloat(card.initial_amount),
    balance: parseFloat(card.balance),
    currency: card.currency,
    giftType: card.gift_type,
    packageType: card.package_type,
    occasion: card.occasion,
    serviceTitle: card.service_title,
    expiryDate: card.expiry_date,
  };
}

/**
 * Redeem gift card balance atomically into customer digital wallet
 */
async function redeemGiftCard({ rawCode, userId }) {
  const codeHash = hashClaimCode(rawCode);
  if (!codeHash) {
    throw new Error('Invalid gift card code format.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the gift card row for update to prevent concurrent double-spending
    const cardRes = await client.query(
      `SELECT * FROM gift_cards WHERE code_hash = $1 FOR UPDATE`,
      [codeHash]
    );

    if (cardRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Invalid or unrecognized gift card code.');
      err.statusCode = 404;
      throw err;
    }

    const card = cardRes.rows[0];

    // 2. Validate status and expiry
    if (card.status !== 'active' || parseFloat(card.balance) <= 0) {
      await client.query('ROLLBACK');
      const err = new Error('This gift card has already been redeemed or is no longer active.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (new Date(card.expiry_date) <= now) {
      await client.query(
        `UPDATE gift_cards SET status = 'expired' WHERE id = $1`,
        [card.id]
      );
      await client.query('COMMIT');
      const err = new Error('This gift card has expired and can no longer be redeemed.');
      err.statusCode = 400;
      throw err;
    }

    const redeemAmount = parseFloat(card.balance);

    // 3. Mark gift card redeemed atomically
    const updateCardRes = await client.query(
      `UPDATE gift_cards
       SET balance = 0, status = 'redeemed', redeemed_at = NOW(), recipient_id = $1
       WHERE id = $2 AND status = 'active'
       RETURNING *`,
      [userId, card.id]
    );

    if (updateCardRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Failed to lock and redeem gift card. Please try again.');
      err.statusCode = 409;
      throw err;
    }

    // 4. Credit user's digital wallet balance
    const walletRes = await client.query(
      `INSERT INTO customer_wallets (user_id, balance, currency, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET balance = customer_wallets.balance + EXCLUDED.balance, updated_at = NOW()
       RETURNING balance, currency`,
      [userId, redeemAmount, card.currency]
    );

    const newBalance = parseFloat(walletRes.rows[0].balance);

    // 5. Record redemption ledger entry
    await client.query(
      `INSERT INTO gift_card_redemptions (gift_card_id, user_id, amount, currency, balance_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [card.id, userId, redeemAmount, card.currency, newBalance]
    );

    await client.query('COMMIT');

    return {
      success: true,
      redeemedAmount: redeemAmount,
      currency: card.currency,
      newWalletBalance: newBalance,
      giftCard: updateCardRes.rows[0],
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Healthcare provider confirms delivery of a service-linked gift voucher
 */
async function confirmServiceDelivery({ rawCode, providerId }) {
  const codeHash = hashClaimCode(rawCode);
  if (!codeHash) {
    throw new Error('Invalid voucher code format.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardRes = await client.query(
      `SELECT * FROM gift_cards WHERE code_hash = $1 FOR UPDATE`,
      [codeHash]
    );

    if (cardRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Voucher code not found.');
      err.statusCode = 404;
      throw err;
    }

    const card = cardRes.rows[0];

    if (card.status === 'delivered') {
      await client.query('ROLLBACK');
      const err = new Error('This voucher service has already been delivered and confirmed.');
      err.statusCode = 400;
      throw err;
    }

    if (card.status !== 'active') {
      await client.query('ROLLBACK');
      const err = new Error(`Voucher cannot be fulfilled (status is ${card.status}).`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (new Date(card.expiry_date) <= now) {
      await client.query('ROLLBACK');
      const err = new Error('This voucher has expired.');
      err.statusCode = 400;
      throw err;
    }

    // Verify provider assignment if assigned
    if (card.service_provider_id && card.service_provider_id !== providerId) {
      await client.query('ROLLBACK');
      const err = new Error('This voucher is designated for another healthcare provider facility.');
      err.statusCode = 403;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE gift_cards
       SET status = 'delivered', delivered_at = NOW(), service_provider_id = COALESCE(service_provider_id, $1)
       WHERE id = $2 AND status = 'active'
       RETURNING *`,
      [providerId, card.id]
    );

    await client.query('COMMIT');

    return {
      success: true,
      deliveredAt: updateRes.rows[0].delivered_at,
      giftCard: updateRes.rows[0],
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get authenticated user's digital wallet balance
 */
async function getWalletBalance(userId) {
  const res = await pool.query(
    `SELECT balance, currency, updated_at
     FROM customer_wallets
     WHERE user_id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    return {
      balance: 0.00,
      currency: 'ETB',
      updated_at: new Date(),
    };
  }

  return {
    balance: parseFloat(res.rows[0].balance),
    currency: res.rows[0].currency,
    updated_at: res.rows[0].updated_at,
  };
}

/**
 * Get user's wallet activity ledger
 */
async function getWalletActivity(userId) {
  const res = await pool.query(
    `SELECT r.id, r.amount, r.currency, r.balance_after, r.created_at,
            g.code, g.occasion, g.package_type, g.service_title
     FROM gift_card_redemptions r
     JOIN gift_cards g ON g.id = r.gift_card_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [userId]
  );

  return res.rows.map((row) => ({
    id: row.id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    balanceAfter: parseFloat(row.balance_after),
    code: row.code,
    occasion: row.occasion,
    packageType: row.package_type,
    serviceTitle: row.service_title,
    createdAt: row.created_at,
  }));
}

/**
 * Get gift cards purchased/sent by user
 */
async function getSentGiftCards(userId) {
  const res = await pool.query(
    `SELECT id, code, initial_amount, balance, currency, gift_type,
            package_type, occasion, service_title, status, recipient_name,
            recipient_email, recipient_phone, personal_message, expiry_date,
            created_at, redeemed_at, delivered_at
     FROM gift_cards
     WHERE sender_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return res.rows.map((row) => ({
    ...row,
    initial_amount: parseFloat(row.initial_amount),
    balance: parseFloat(row.balance),
  }));
}

/**
 * Get gift cards claimed/received by user
 */
async function getReceivedGiftCards(userId) {
  const res = await pool.query(
    `SELECT g.id, g.code, g.initial_amount, g.currency, g.gift_type,
            g.package_type, g.occasion, g.service_title, g.personal_message,
            g.redeemed_at, g.delivered_at, u.full_name as sender_name
     FROM gift_cards g
     JOIN users u ON u.id = g.sender_id
     WHERE g.recipient_id = $1
     ORDER BY g.redeemed_at DESC NULLS LAST`,
    [userId]
  );

  return res.rows.map((row) => ({
    ...row,
    initial_amount: parseFloat(row.initial_amount),
  }));
}

/**
 * Purchase a gift card or voucher using customer's digital wallet balance
 */
async function purchaseGiftCardWithWallet({
  senderId,
  amount,
  currency = 'ETB',
  giftType = 'monetary',
  packageType = 'custom',
  occasion = 'general',
  serviceTitle,
  serviceCategory,
  serviceProviderId,
  recipientEmail,
  recipientPhone,
  recipientName,
  personalMessage,
  scheduledDeliveryDate = null,
  metadata = {},
}) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const err = new Error('Gift card amount must be greater than zero.');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock customer wallet
    const walletRes = await client.query(
      `SELECT * FROM customer_wallets WHERE user_id = $1 FOR UPDATE`,
      [senderId]
    );

    const currentBal = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) : 0;
    if (walletRes.rows.length === 0 || currentBal < numericAmount) {
      await client.query('ROLLBACK');
      const err = new Error(
        `Insufficient digital wallet balance. Current balance is ${currentBal.toFixed(2)} ${currency}, but ${numericAmount.toFixed(2)} ${currency} is required.`
      );
      err.statusCode = 400;
      throw err;
    }

    const newBalance = currentBal - numericAmount;

    // 2. Deduct from wallet
    await client.query(
      `UPDATE customer_wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, senderId]
    );

    // 3. Generate claim code
    let claimCode = '';
    let codeHash = '';
    let attempts = 0;
    while (attempts < 5) {
      claimCode = generateClaimCode();
      codeHash = hashClaimCode(claimCode);
      const existing = await client.query('SELECT id FROM gift_cards WHERE code_hash = $1', [codeHash]);
      if (existing.rows.length === 0) break;
      attempts++;
    }
    if (attempts >= 5) {
      await client.query('ROLLBACK');
      throw new Error('Failed to generate unique claim code. Please try again.');
    }

    const expiryMonths = packageType === 'vip' ? 24 : 12;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    const mergedMetadata = {
      ...metadata,
      paymentMethod: 'wallet',
      paidViaWallet: true,
      deductedAt: new Date().toISOString(),
    };

    const scheduledDate = scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : null;

    // 4. Insert gift card
    const insertRes = await client.query(
      `INSERT INTO gift_cards (
        sender_id, code, code_hash, initial_amount, balance, currency,
        gift_type, package_type, occasion, service_title, service_category,
        service_provider_id, status, recipient_email, recipient_phone,
        recipient_name, personal_message, expiry_date, scheduled_delivery_date, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        senderId, claimCode, codeHash, numericAmount, numericAmount, currency,
        giftType, packageType, occasion, serviceTitle || null, serviceCategory || null,
        serviceProviderId || null, recipientEmail || null, recipientPhone || null,
        recipientName || null, personalMessage || null, expiryDate, scheduledDate, JSON.stringify(mergedMetadata),
      ]
    );

    await client.query('COMMIT');

    const createdCard = insertRes.rows[0];

    return {
      success: true,
      giftCard: {
        id: createdCard.id,
        code: claimCode,
        initialAmount: parseFloat(createdCard.initial_amount),
        balance: parseFloat(createdCard.balance),
        currency: createdCard.currency,
        giftType: createdCard.gift_type,
        packageType: createdCard.package_type,
        occasion: createdCard.occasion,
        serviceTitle: createdCard.service_title,
        serviceCategory: createdCard.service_category,
        recipientEmail: createdCard.recipient_email,
        recipientPhone: createdCard.recipient_phone,
        recipientName: createdCard.recipient_name,
        personalMessage: createdCard.personal_message,
        expiryDate: createdCard.expiry_date,
        createdAt: createdCard.created_at,
        metadata: createdCard.metadata,
      },
      newWalletBalance: newBalance,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieve patient service vouchers associated with a provider
 */
async function getProviderVouchers({ providerId, status, search, limit = 50, offset = 0 }) {
  const whereClauses = [];
  const params = [];

  if (providerId) {
    params.push(providerId);
    whereClauses.push(`(g.service_provider_id = $${params.length} OR (g.service_provider_id IS NULL AND g.gift_type = 'service'))`);
  } else {
    whereClauses.push(`g.gift_type = 'service'`);
  }

  if (status && status !== 'all') {
    params.push(status);
    whereClauses.push(`g.status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const sIdx = params.length;
    whereClauses.push(`(
      g.code ILIKE $${sIdx} OR
      g.recipient_name ILIKE $${sIdx} OR
      g.recipient_email ILIKE $${sIdx} OR
      g.recipient_phone ILIKE $${sIdx} OR
      g.service_title ILIKE $${sIdx} OR
      u.full_name ILIKE $${sIdx}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Stats query
  const statsQuery = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN g.status = 'active' THEN 1 END)::int AS active_count,
      COUNT(CASE WHEN g.status = 'delivered' THEN 1 END)::int AS delivered_count,
      COALESCE(SUM(CASE WHEN g.status = 'delivered' THEN g.initial_amount ELSE 0 END), 0)::numeric AS delivered_value
    FROM gift_cards g
    LEFT JOIN users u ON g.sender_id = u.id
    ${whereSql}
  `;

  const statsRes = await pool.query(statsQuery, params);
  const statsRow = statsRes.rows[0] || {};

  // List query with pagination
  const listParams = [...params];
  listParams.push(limit);
  const limitIdx = listParams.length;
  listParams.push(offset);
  const offsetIdx = listParams.length;

  const listQuery = `
    SELECT
      g.id, g.code, g.initial_amount, g.balance, g.currency,
      g.gift_type, g.package_type, g.occasion, g.service_title,
      g.service_category, g.service_provider_id, g.status,
      g.recipient_name, g.recipient_email, g.recipient_phone,
      g.personal_message, g.expiry_date, g.created_at,
      g.redeemed_at, g.delivered_at, g.metadata,
      u.full_name AS sender_name, u.email AS sender_email,
      p.provider_name
    FROM gift_cards g
    LEFT JOIN users u ON g.sender_id = u.id
    LEFT JOIN providers p ON g.service_provider_id = p.id
    ${whereSql}
    ORDER BY g.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const listRes = await pool.query(listQuery, listParams);

  return {
    vouchers: listRes.rows.map((row) => ({
      id: row.id,
      code: row.code,
      initial_amount: parseFloat(row.initial_amount),
      balance: parseFloat(row.balance),
      currency: row.currency,
      gift_type: row.gift_type,
      package_type: row.package_type,
      occasion: row.occasion,
      service_title: row.service_title,
      service_category: row.service_category,
      service_provider_id: row.service_provider_id,
      provider_name: row.provider_name,
      status: row.status,
      recipient_name: row.recipient_name,
      recipient_email: row.recipient_email,
      recipient_phone: row.recipient_phone,
      sender_name: row.sender_name,
      sender_email: row.sender_email,
      personal_message: row.personal_message,
      expiry_date: row.expiry_date,
      created_at: row.created_at,
      redeemed_at: row.redeemed_at,
      delivered_at: row.delivered_at,
      metadata: row.metadata,
    })),
    stats: {
      total: parseInt(statsRow.total || 0, 10),
      activeCount: parseInt(statsRow.active_count || 0, 10),
      deliveredCount: parseInt(statsRow.delivered_count || 0, 10),
      deliveredValue: parseFloat(statsRow.delivered_value || 0),
    },
  };
}

/**
 * Finalizes gift card creation when a Chapa payment transaction completes
 */
async function finalizePaidGiftCard(tx) {
  if (!tx || !tx.metadata || !tx.metadata.giftCardDetails) return null;

  // Check if gift card was already created in pending_payment state
  const pendingCard = await pool.query(
    `SELECT * FROM gift_cards WHERE metadata->>'tx_ref' = $1`,
    [tx.tx_ref]
  );

  if (pendingCard.rows.length > 0) {
    const card = pendingCard.rows[0];
    if (card.status === 'pending_payment') {
      const updateRes = await pool.query(
        `UPDATE gift_cards
         SET status = 'active',
             metadata = metadata || $1::jsonb
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify({ chapa_reference: tx.chapa_reference, paidAt: tx.completed_at || new Date().toISOString() }), card.id]
      );
      return updateRes.rows[0];
    }
    return card;
  }

  const d = tx.metadata.giftCardDetails || {};
  const mergedMetadata = {
    ...d.metadata,
    tx_ref: tx.tx_ref,
    chapa_reference: tx.chapa_reference,
    paymentMethod: 'chapa',
    paidAt: tx.completed_at || new Date().toISOString(),
  };

  const giftCard = await purchaseGiftCard({
    senderId: tx.user_id,
    amount: parseFloat(tx.amount),
    currency: tx.currency,
    giftType: d.giftType || 'monetary',
    packageType: d.packageType || 'basic',
    occasion: d.occasion || 'General',
    serviceTitle: d.serviceTitle,
    serviceCategory: d.serviceCategory,
    serviceProviderId: d.serviceProviderId,
    recipientEmail: d.recipientEmail,
    recipientPhone: d.recipientPhone,
    recipientName: d.recipientName,
    personalMessage: d.personalMessage,
    scheduledDeliveryDate: d.scheduledDeliveryDate || null,
    status: 'active',
    metadata: mergedMetadata,
  });

  // Update transaction metadata with gift card id and code
  await pool.query(
    `UPDATE transactions
     SET metadata = metadata || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify({ gift_card_id: giftCard.id, gift_card_code: giftCard.code }), tx.id]
  );

  return giftCard;
}

/**
 * Publicly view a gift card for guest claim / preview without sensitive PII
 */
async function getPublicGiftCard(rawCode) {
  const codeHash = hashClaimCode(rawCode);
  if (!codeHash) {
    const err = new Error('Invalid voucher code format.');
    err.statusCode = 400;
    throw err;
  }

  const res = await pool.query(
    `SELECT g.id, g.code, g.initial_amount, g.balance, g.currency,
            g.gift_type, g.package_type, g.occasion, g.service_title,
            g.service_category, g.status, g.recipient_name,
            g.personal_message, g.expiry_date, g.created_at,
            g.scheduled_delivery_date, g.delivered_at,
            u.full_name AS sender_name,
            p.provider_name
     FROM gift_cards g
     LEFT JOIN users u ON g.sender_id = u.id
     LEFT JOIN providers p ON g.service_provider_id = p.id
     WHERE g.code_hash = $1`,
    [codeHash]
  );

  if (res.rows.length === 0) {
    const err = new Error('Gift voucher not found.');
    err.statusCode = 404;
    throw err;
  }

  const row = res.rows[0];
  const isExpired = new Date(row.expiry_date) <= new Date();

  return {
    id: row.id,
    code: row.code,
    senderName: row.sender_name || 'An ODS Member',
    recipientName: row.recipient_name || 'Valued Recipient',
    initialAmount: parseFloat(row.initial_amount),
    balance: parseFloat(row.balance),
    currency: row.currency,
    giftType: row.gift_type,
    packageType: row.package_type,
    occasion: row.occasion,
    serviceTitle: row.service_title,
    serviceCategory: row.service_category,
    providerName: row.provider_name,
    personalMessage: row.personal_message,
    status: isExpired && row.status === 'active' ? 'expired' : row.status,
    expiryDate: row.expiry_date,
    scheduledDeliveryDate: row.scheduled_delivery_date,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    isClaimable: row.status === 'active' && !isExpired && parseFloat(row.balance) > 0,
  };
}

module.exports = {
  generateClaimCode,
  hashClaimCode,
  purchaseGiftCard,
  purchaseGiftCardWithWallet,
  finalizePaidGiftCard,
  checkGiftCard,
  getPublicGiftCard,
  redeemGiftCard,
  confirmServiceDelivery,
  getWalletBalance,
  getWalletActivity,
  getSentGiftCards,
  getReceivedGiftCards,
  getProviderVouchers,
};
