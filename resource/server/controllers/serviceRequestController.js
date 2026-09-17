const { pool } = require("../config/db");
const sendEmail = require("../services/emailService");
const {
  NOTIFICATION_TYPES,
  createNotificationsForUsers,
} = require("../services/userNotificationService");

const REQUEST_STATUSES = ["pending", "open", "in_progress", "completed", "rejected", "accepted"];
const PROPOSAL_STATUSES = ["pending", "accepted", "rejected"];

const ADMIN_ROLES = ["admin", "super_admin", "customer_support_admin"];

const isAdminRole = (role = "") => ADMIN_ROLES.includes(String(role).toLowerCase());
const isProviderRole = (role = "") => ["provider", "corporate"].includes(String(role).toLowerCase());

const safeSendEmail = async (payload) => {
  try {
    await sendEmail(payload);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

const fetchSuperAdminIds = async () => {
  const [rows] = await pool.query(`SELECT id FROM users WHERE role = 'super_admin'`);
  return rows.map((r) => r.id);
};

const notifyStakeholdersOnRequestCreated = async (created, serviceProviderId) => {
  const adminIds = await fetchSuperAdminIds();
  const baseMeta = {
    serviceRequestId: created.id,
    serviceId: created.service_id ?? null,
  };
  if (adminIds.length) {
    await createNotificationsForUsers(adminIds, {
      type: NOTIFICATION_TYPES.SERVICE_REQUEST_SUBMITTED_ADMIN,
      message: `New service request #${created.id}: ${created.title}`,
      metadata: baseMeta,
      dedupeKeyForUser: (uid) => `sr_submitted:${created.id}:super_admin:${uid}`,
    });
  }
  if (serviceProviderId) {
    await createNotificationsForUsers([serviceProviderId], {
      type: NOTIFICATION_TYPES.SERVICE_REQUEST_SUBMITTED_PROVIDER,
      message: `A customer submitted a request for your service (request #${created.id}).`,
      metadata: baseMeta,
      dedupeKeyForUser: (uid) => `sr_submitted:${created.id}:provider:${uid}`,
    });
  }
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (!rows.length) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureServiceRequestTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      occasion VARCHAR(120) DEFAULT NULL,
      location VARCHAR(255) NOT NULL,
      budget DECIMAL(12,2) DEFAULT NULL,
      preferred_date DATE DEFAULT NULL,
      status ENUM('pending', 'open', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_service_requests_user_id (user_id),
      INDEX idx_service_requests_status (status),
      CONSTRAINT fk_service_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    await pool.query(`ALTER TABLE service_requests MODIFY COLUMN user_id INT NULL`);
  } catch (err) {
    console.warn("Could not modify service_requests.user_id to NULL:", err.message);
  }

  await addColumnIfMissing("service_requests", "requester_name", "VARCHAR(150) NULL");
  await addColumnIfMissing("service_requests", "requester_email", "VARCHAR(190) NULL");
  await addColumnIfMissing("service_requests", "requester_whatsapp", "VARCHAR(60) NULL");
  await addColumnIfMissing("service_requests", "requester_phone", "VARCHAR(60) NULL");
  await addColumnIfMissing(
    "service_requests",
    "request_type",
    "ENUM('service','gift') NOT NULL DEFAULT 'service'"
  );
  await addColumnIfMissing("service_requests", "service_type", "VARCHAR(120) NULL");
  await addColumnIfMissing("service_requests", "gift_recipients", "JSON NULL");
  await addColumnIfMissing("service_requests", "service_id", "INT NULL");
  await addColumnIfMissing("service_requests", "accepted_provider_id", "INT NULL");
  await addColumnIfMissing("service_requests", "acceptance_message", "TEXT NULL");

  try {
    await pool.query(
      `ALTER TABLE service_requests MODIFY COLUMN status ENUM('pending', 'open', 'in_progress', 'completed', 'rejected', 'accepted') NOT NULL DEFAULT 'pending'`
    );
  } catch (err) {
    console.warn("service_requests status ENUM update (may already match):", err.message);
  }

  try {
    await pool.query(`ALTER TABLE service_requests MODIFY COLUMN location VARCHAR(255) NULL`);
  } catch (err) {
    console.warn("service_requests location nullable update:", err.message);
  }

  try {
    await pool.query(`
      ALTER TABLE service_requests
      ADD CONSTRAINT fk_service_requests_service
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    `);
  } catch (err) {
    if (!String(err.message).includes("Duplicate") && err.code !== "ER_CANT_CREATE_TABLE") {
      console.warn("fk_service_requests_service:", err.message);
    }
  }

  try {
    await pool.query(`
      ALTER TABLE service_requests
      ADD CONSTRAINT fk_service_requests_accepted_provider
      FOREIGN KEY (accepted_provider_id) REFERENCES users(id) ON DELETE SET NULL
    `);
  } catch (err) {
    if (!String(err.message).includes("Duplicate") && err.code !== "ER_CANT_CREATE_TABLE") {
      console.warn("fk_service_requests_accepted_provider:", err.message);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      provider_id INT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      message TEXT DEFAULT NULL,
      status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_request_proposals_request_id (request_id),
      INDEX idx_request_proposals_provider_id (provider_id),
      INDEX idx_request_proposals_status (status),
      UNIQUE KEY uniq_request_provider (request_id, provider_id),
      CONSTRAINT fk_request_proposals_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_request_proposals_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const createRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (isProviderRole(userRole)) {
      return res.status(403).json({ msg: "Providers cannot create service requests." });
    }

    const serviceIdRaw = req.body?.serviceId ?? req.body?.service_id;
    const parsedServiceId =
      serviceIdRaw !== undefined && serviceIdRaw !== null && serviceIdRaw !== ""
        ? Number(serviceIdRaw)
        : null;

    if (parsedServiceId != null && Number.isInteger(parsedServiceId) && parsedServiceId > 0) {
      if (!userId) {
        return res.status(401).json({ msg: "Authentication required to request a service." });
      }
      const {
        description: marketplaceDescription,
        location: locBody,
        budget: marketplaceBudget,
        preferred_date: preferredDateMarketplace,
      } = req.body || {};

      if (!marketplaceDescription || !String(marketplaceDescription).trim()) {
        return res.status(400).json({ msg: "description is required." });
      }

      const [[svc]] = await pool.query(`SELECT id, title, providerId FROM services WHERE id = ?`, [
        parsedServiceId,
      ]);
      if (!svc) return res.status(404).json({ msg: "Service not found." });

      const budgetValueMarketplace =
        marketplaceBudget === null || marketplaceBudget === undefined || marketplaceBudget === ""
          ? null
          : Number(marketplaceBudget);
      if (budgetValueMarketplace !== null && Number.isNaN(budgetValueMarketplace)) {
        return res.status(400).json({ msg: "budget must be a valid number." });
      }

      const titleFromService = String(svc.title || "Service").trim();
      const locationMarketplace =
        locBody != null && String(locBody).trim() !== "" ? String(locBody).trim() : null;
      const requesterNameMarketplace = String(req.user.fullName || "Member").trim();
      const requesterEmailMarketplace = String(req.user.email || "").trim();
      if (!requesterEmailMarketplace) {
        return res.status(400).json({ msg: "Your account must have an email to submit a request." });
      }

      const [resultMarketplace] = await pool.query(
        `INSERT INTO service_requests
        (user_id, service_id, title, description, occasion, location, budget, preferred_date, status,
         requester_name, requester_email, requester_whatsapp, requester_phone, request_type, service_type, gift_recipients)
        VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'pending', ?, ?, NULL, NULL, 'service', NULL, NULL)`,
        [
          userId,
          parsedServiceId,
          titleFromService,
          String(marketplaceDescription).trim(),
          locationMarketplace,
          budgetValueMarketplace,
          preferredDateMarketplace || null,
          requesterNameMarketplace,
          requesterEmailMarketplace,
        ]
      );

      const [[createdMarketplace]] = await pool.query(
        `SELECT id, user_id, service_id, title, description, occasion, location, budget, preferred_date, status,
                accepted_provider_id, acceptance_message,
                requester_name, requester_email, requester_whatsapp, requester_phone, request_type, service_type, gift_recipients,
                created_at, updated_at
         FROM service_requests WHERE id = ?`,
        [resultMarketplace.insertId]
      );

      await notifyStakeholdersOnRequestCreated(createdMarketplace, svc.providerId);

      await safeSendEmail({
        to: createdMarketplace.requester_email,
        subject: "Service request submitted",
        text: `Hi ${createdMarketplace.requester_name}, your request for "${titleFromService}" is pending. We will notify you when a provider accepts.`,
        html: `<p>Hi <strong>${createdMarketplace.requester_name}</strong>,</p>
        <p>Your request for <strong>${titleFromService}</strong> is <strong>pending</strong>.</p>`,
      });

      const adminRecipientsMarketplace = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      if (adminRecipientsMarketplace.length > 0) {
        await safeSendEmail({
          to: adminRecipientsMarketplace.join(","),
          subject: "New marketplace service request",
          text: `Request #${createdMarketplace.id} for service "${titleFromService}" (${requesterEmailMarketplace})`,
          html: `<p>New request <strong>#${createdMarketplace.id}</strong> for <strong>${titleFromService}</strong> by ${requesterEmailMarketplace}.</p>`,
        });
      }

      return res.status(201).json({ msg: "Service request created", request: createdMarketplace });
    }

    const {
      title,
      description,
      occasion,
      location,
      budget,
      preferred_date: preferredDate,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_whatsapp: requesterWhatsapp,
      requester_phone: requesterPhone,
      request_type: requestTypeRaw,
      service_type: serviceType,
      gift_recipients: giftRecipientsRaw,
    } = req.body || {};

    const requestType = requestTypeRaw === "gift" ? "gift" : "service";
    let giftRecipients = null;
    if (requestType === "gift" && giftRecipientsRaw) {
      if (Array.isArray(giftRecipientsRaw)) {
        giftRecipients = giftRecipientsRaw;
      } else if (typeof giftRecipientsRaw === "string") {
        try {
          giftRecipients = JSON.parse(giftRecipientsRaw);
        } catch (e) {
          return res.status(400).json({ msg: "gift_recipients must be a valid JSON array." });
        }
      }
      if (giftRecipients && !Array.isArray(giftRecipients)) {
        return res.status(400).json({ msg: "gift_recipients must be an array." });
      }
    }

    if (!title || !description || !location || !requesterName || !requesterEmail) {
      return res.status(400).json({
        msg: "title, description, location, requester_name, and requester_email are required.",
      });
    }

    if (requestType === "gift" && (!giftRecipients || giftRecipients.length === 0)) {
      return res.status(400).json({ msg: "gift_recipients is required for gift requests." });
    }

    const budgetValue =
      budget === null || budget === undefined || budget === ""
        ? null
        : Number(budget);
    if (budgetValue !== null && Number.isNaN(budgetValue)) {
      return res.status(400).json({ msg: "budget must be a valid number." });
    }

    const [result] = await pool.query(
      `INSERT INTO service_requests
      (user_id, title, description, occasion, location, budget, preferred_date, status,
       requester_name, requester_email, requester_whatsapp, requester_phone, request_type, service_type, gift_recipients)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        String(title).trim(),
        String(description).trim(),
        occasion ? String(occasion).trim() : null,
        String(location).trim(),
        budgetValue,
        preferredDate || null,
        String(requesterName).trim(),
        String(requesterEmail).trim(),
        requesterWhatsapp ? String(requesterWhatsapp).trim() : null,
        requesterPhone ? String(requesterPhone).trim() : null,
        requestType,
        serviceType ? String(serviceType).trim() : null,
        giftRecipients ? JSON.stringify(giftRecipients) : null,
      ]
    );

    const [[created]] = await pool.query(
      `SELECT id, user_id, service_id, title, description, occasion, location, budget, preferred_date, status,
              accepted_provider_id, acceptance_message,
              requester_name, requester_email, requester_whatsapp, requester_phone, request_type, service_type, gift_recipients,
              created_at, updated_at
       FROM service_requests WHERE id = ?`,
      [result.insertId]
    );

    const requestSummary = `${created.title} (${created.request_type}) - ${created.location}`;
    await safeSendEmail({
      to: created.requester_email,
      subject: "Service request submitted successfully",
      text: `Hi ${created.requester_name}, your request has been submitted and is now pending review.\n\n${requestSummary}`,
      html: `<p>Hi <strong>${created.requester_name}</strong>,</p>
      <p>Your request has been submitted and is now <strong>pending</strong>.</p>
      <p>${requestSummary}</p>`,
    });

    const adminRecipients = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    if (adminRecipients.length > 0) {
      await safeSendEmail({
        to: adminRecipients.join(","),
        subject: "New custom service request submitted",
        text: `New request #${created.id} by ${created.requester_name} (${created.requester_email})`,
        html: `<p>New request <strong>#${created.id}</strong> submitted by ${created.requester_name} (${created.requester_email}).</p>`,
      });
    }

    await notifyStakeholdersOnRequestCreated(created, null);

    return res.status(201).json({ msg: "Service request created", request: created });
  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({ msg: "Failed to create request", error: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Authentication required" });

    const [rows] = await pool.query(
      `SELECT id, user_id, service_id, title, description, occasion, location, budget, preferred_date, status,
              accepted_provider_id, acceptance_message,
              requester_name, requester_email, requester_whatsapp, requester_phone, request_type, service_type, gift_recipients,
              created_at, updated_at
       FROM service_requests
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error("getMyRequests error:", err);
    return res.status(500).json({ msg: "Failed to fetch user requests", error: err.message });
  }
};

const getOpenRequests = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!isProviderRole(userRole) && !isAdminRole(userRole)) {
      return res.status(403).json({ msg: "Providers only." });
    }

    const [rows] = await pool.query(
      `SELECT sr.id, sr.user_id, sr.service_id, sr.title, sr.description, sr.occasion, sr.location, sr.budget, sr.preferred_date, sr.status,
              sr.requester_name, sr.requester_email, sr.requester_whatsapp, sr.requester_phone, sr.request_type, sr.service_type, sr.gift_recipients,
              sr.created_at, sr.updated_at,
              u.fullName AS requested_by
       FROM service_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       WHERE sr.accepted_provider_id IS NULL
         AND (
           sr.status = 'open'
           OR (sr.status = 'pending' AND sr.service_id IS NULL AND sr.request_type = 'service')
         )
       ORDER BY sr.created_at DESC`
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error("getOpenRequests error:", err);
    return res.status(500).json({ msg: "Failed to fetch open requests", error: err.message });
  }
};

const submitProposal = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const providerId = req.user?.id;
    const userRole = req.user?.role;

    if (!Number.isInteger(requestId)) return res.status(400).json({ msg: "Invalid request id." });
    if (!isProviderRole(userRole) && !isAdminRole(userRole)) {
      return res.status(403).json({ msg: "Providers only." });
    }

    const { price, message } = req.body || {};
    const priceValue = Number(price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      return res.status(400).json({ msg: "price must be a positive number." });
    }

    const [[requestRow]] = await pool.query(
      `SELECT id, status FROM service_requests WHERE id = ?`,
      [requestId]
    );
    if (!requestRow) return res.status(404).json({ msg: "Service request not found." });
    if (requestRow.status !== "open") {
      return res.status(400).json({ msg: "Proposals can only be submitted to open requests." });
    }

    const [result] = await pool.query(
      `INSERT INTO request_proposals (request_id, provider_id, price, message, status)
       VALUES (?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE price = VALUES(price), message = VALUES(message), status = 'pending'`,
      [requestId, providerId, priceValue, message ? String(message).trim() : null]
    );

    const proposalId = result.insertId
      ? result.insertId
      : (
          await pool.query(
            `SELECT id FROM request_proposals WHERE request_id = ? AND provider_id = ? LIMIT 1`,
            [requestId, providerId]
          )
        )[0][0]?.id;

    const [[proposal]] = await pool.query(
      `SELECT rp.id, rp.request_id, rp.provider_id, rp.price, rp.message, rp.status, rp.created_at,
              u.fullName AS provider_name
       FROM request_proposals rp
       LEFT JOIN users u ON rp.provider_id = u.id
       WHERE rp.id = ?`,
      [proposalId]
    );

    return res.status(201).json({ msg: "Proposal submitted", proposal });
  } catch (err) {
    console.error("submitProposal error:", err);
    return res.status(500).json({ msg: "Failed to submit proposal", error: err.message });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!Number.isInteger(requestId)) return res.status(400).json({ msg: "Invalid request id." });

    const [[requestRow]] = await pool.query(
      `SELECT sr.id, sr.user_id, sr.title, sr.description, sr.occasion, sr.location, sr.budget, sr.preferred_date, sr.status,
              sr.requester_name, sr.requester_email, sr.requester_whatsapp, sr.requester_phone, sr.request_type, sr.service_type, sr.gift_recipients,
              sr.created_at, sr.updated_at,
              u.fullName AS requested_by
       FROM service_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       WHERE sr.id = ?`,
      [requestId]
    );

    if (!requestRow) return res.status(404).json({ msg: "Service request not found." });

    const canViewAllProposals = isAdminRole(userRole) || requestRow.user_id === userId || isProviderRole(userRole);

    const [proposals] = await pool.query(
      `SELECT rp.id, rp.request_id, rp.provider_id, rp.price, rp.message, rp.status, rp.created_at,
              u.fullName AS provider_name
       FROM request_proposals rp
       LEFT JOIN users u ON rp.provider_id = u.id
       WHERE rp.request_id = ?
       ORDER BY rp.created_at DESC`,
      [requestId]
    );

    const filteredProposals = canViewAllProposals
      ? proposals
      : proposals.filter((p) => p.provider_id === userId);

    return res.status(200).json({ ...requestRow, proposals: filteredProposals });
  } catch (err) {
    console.error("getRequestDetails error:", err);
    return res.status(500).json({ msg: "Failed to fetch request details", error: err.message });
  }
};

const updateProposalStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const proposalId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status } = req.body || {};

    if (!Number.isInteger(proposalId)) return res.status(400).json({ msg: "Invalid proposal id." });
    if (!PROPOSAL_STATUSES.includes(status)) {
      return res.status(400).json({ msg: `Invalid proposal status. Allowed: ${PROPOSAL_STATUSES.join(", ")}` });
    }

    await connection.beginTransaction();

    const [[proposal]] = await connection.query(
      `SELECT id, request_id, provider_id, status FROM request_proposals WHERE id = ? FOR UPDATE`,
      [proposalId]
    );
    if (!proposal) {
      await connection.rollback();
      return res.status(404).json({ msg: "Proposal not found." });
    }

    const [[requestRow]] = await connection.query(
      `SELECT id, user_id, status FROM service_requests WHERE id = ? FOR UPDATE`,
      [proposal.request_id]
    );
    if (!requestRow) {
      await connection.rollback();
      return res.status(404).json({ msg: "Request not found." });
    }

    const canManage = isAdminRole(userRole) || requestRow.user_id === userId;
    if (!canManage) {
      await connection.rollback();
      return res.status(403).json({ msg: "You cannot update this proposal." });
    }

    if (status === "accepted") {
      await connection.query(
        `UPDATE request_proposals SET status = 'accepted' WHERE id = ?`,
        [proposalId]
      );
      await connection.query(
        `UPDATE request_proposals SET status = 'rejected' WHERE request_id = ? AND id <> ?`,
        [proposal.request_id, proposalId]
      );
      await connection.query(
        `UPDATE service_requests SET status = 'in_progress', updated_at = NOW() WHERE id = ?`,
        [proposal.request_id]
      );

      const [[requestDetails]] = await connection.query(
        `SELECT id, title, requester_name, requester_email FROM service_requests WHERE id = ?`,
        [proposal.request_id]
      );
      const [[acceptedProvider]] = await connection.query(
        `SELECT u.fullName, u.email, rp.price
         FROM request_proposals rp
         JOIN users u ON u.id = rp.provider_id
         WHERE rp.id = ?`,
        [proposalId]
      );
      const [rejectedProviders] = await connection.query(
        `SELECT u.fullName, u.email
         FROM request_proposals rp
         JOIN users u ON u.id = rp.provider_id
         WHERE rp.request_id = ? AND rp.id <> ?`,
        [proposal.request_id, proposalId]
      );

      await connection.commit();

      if (requestDetails?.requester_email) {
        await safeSendEmail({
          to: requestDetails.requester_email,
          subject: "Your request has been confirmed",
          text: `Hi ${requestDetails.requester_name || "there"}, your request "${requestDetails.title}" has a confirmed provider offer.`,
          html: `<p>Hi ${requestDetails.requester_name || "there"},</p>
          <p>Your request <strong>${requestDetails.title}</strong> has been confirmed.</p>
          <p>Selected provider: <strong>${acceptedProvider?.fullName || "Provider"}</strong> at ETB ${acceptedProvider?.price || ""}.</p>`,
        });
      }

      if (acceptedProvider?.email) {
        await safeSendEmail({
          to: acceptedProvider.email,
          subject: "Your proposal was accepted",
          text: `Your proposal for request "${requestDetails?.title || ""}" was accepted.`,
          html: `<p>Congratulations ${acceptedProvider.fullName || ""}, your proposal for <strong>${requestDetails?.title || ""}</strong> was accepted.</p>`,
        });
      }

      for (const rejected of rejectedProviders || []) {
        if (rejected.email) {
          await safeSendEmail({
            to: rejected.email,
            subject: "Proposal update",
            text: `Your proposal for request "${requestDetails?.title || ""}" was not selected this time.`,
            html: `<p>Hello ${rejected.fullName || ""}, your proposal for <strong>${requestDetails?.title || ""}</strong> was not selected this time.</p>`,
          });
        }
      }
      return res.status(200).json({ msg: "Proposal status updated and notifications sent" });
    } else {
      await connection.query(
        `UPDATE request_proposals SET status = ? WHERE id = ?`,
        [status, proposalId]
      );
      await connection.commit();
      return res.status(200).json({ msg: "Proposal status updated" });
    }
  } catch (err) {
    await connection.rollback();
    console.error("updateProposalStatus error:", err);
    return res.status(500).json({ msg: "Failed to update proposal status", error: err.message });
  } finally {
    connection.release();
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status } = req.body || {};

    if (!Number.isInteger(requestId)) return res.status(400).json({ msg: "Invalid request id." });
    if (!REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ msg: `Invalid request status. Allowed: ${REQUEST_STATUSES.join(", ")}` });
    }

    const [[requestRow]] = await pool.query(
      `SELECT id, user_id FROM service_requests WHERE id = ?`,
      [requestId]
    );
    if (!requestRow) return res.status(404).json({ msg: "Request not found." });

    const [[acceptedProposal]] = await pool.query(
      `SELECT provider_id FROM request_proposals WHERE request_id = ? AND status = 'accepted' LIMIT 1`,
      [requestId]
    );

    const isOwner = requestRow.user_id === userId;
    const isAcceptedProvider = acceptedProposal?.provider_id === userId;
    const isAdmin = isAdminRole(userRole);
    if (!isOwner && !isAcceptedProvider && !isAdmin) {
      return res.status(403).json({ msg: "You cannot update this request status." });
    }

    await pool.query(
      `UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, requestId]
    );

    return res.status(200).json({ msg: "Request status updated" });
  } catch (err) {
    console.error("updateRequestStatus error:", err);
    return res.status(500).json({ msg: "Failed to update request status", error: err.message });
  }
};

const listRequestsRoleBased = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = String(req.user?.role || "").toLowerCase();
    if (!userId) return res.status(401).json({ msg: "Authentication required" });

    const canViewAll = isAdminRole(role);
    const providerRoles = ["provider", "corporate"];

    let rows;
    if (canViewAll) {
      [rows] = await pool.query(
        `SELECT sr.id, sr.user_id, sr.service_id, sr.title, sr.description, sr.occasion, sr.location,
                sr.budget, sr.preferred_date, sr.status, sr.accepted_provider_id, sr.acceptance_message,
                sr.requester_name, sr.requester_email, sr.requester_whatsapp, sr.requester_phone,
                sr.request_type, sr.service_type, sr.gift_recipients, sr.created_at, sr.updated_at,
                s.title AS service_title,
                u.fullName AS requested_by_name
         FROM service_requests sr
         LEFT JOIN services s ON sr.service_id = s.id
         LEFT JOIN users u ON sr.user_id = u.id
         ORDER BY sr.created_at DESC`
      );
    } else if (providerRoles.includes(role)) {
      [rows] = await pool.query(
        `SELECT sr.id, sr.user_id, sr.service_id, sr.title, sr.description, sr.occasion, sr.location,
                sr.budget, sr.preferred_date, sr.status, sr.accepted_provider_id, sr.acceptance_message,
                sr.requester_name, sr.requester_email, sr.requester_whatsapp, sr.requester_phone,
                sr.request_type, sr.service_type, sr.gift_recipients, sr.created_at, sr.updated_at,
                s.title AS service_title,
                u.fullName AS requested_by_name
         FROM service_requests sr
         INNER JOIN services s ON sr.service_id = s.id AND s.providerId = ?
         LEFT JOIN users u ON sr.user_id = u.id
         ORDER BY sr.created_at DESC`,
        [userId]
      );
    } else {
      return res.status(403).json({
        msg: "Access denied. Super admins and service providers can list requests here.",
      });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error("listRequestsRoleBased error:", err);
    return res.status(500).json({ msg: "Failed to fetch requests", error: err.message });
  }
};

const acceptServiceRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const requestId = Number(req.params.id);
    const providerId = req.user?.id;
    const role = String(req.user?.role || "").toLowerCase();

    if (!["provider", "corporate"].includes(role)) {
      return res.status(403).json({ msg: "Only service providers can accept requests." });
    }
    if (!providerId) return res.status(401).json({ msg: "Authentication required" });
    if (!Number.isInteger(requestId)) return res.status(400).json({ msg: "Invalid request id." });

    const { acceptance_message: acceptanceMessage, message: messageAlt } = req.body || {};
    const rawMsg = acceptanceMessage ?? messageAlt;
    const msg =
      rawMsg != null && String(rawMsg).trim() !== "" ? String(rawMsg).trim().slice(0, 2000) : null;

    await connection.beginTransaction();

    const [[row]] = await connection.query(
      `SELECT id, user_id, service_id, status, title, request_type, accepted_provider_id
       FROM service_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (!row) {
      await connection.rollback();
      return res.status(404).json({ msg: "Service request not found." });
    }

    if (row.request_type === "gift") {
      await connection.rollback();
      return res.status(400).json({ msg: "Gift requests cannot be accepted by providers." });
    }

    // Catalog-linked requests can only be accepted by the owning provider.
    // Custom requests (no linked service) are open for any provider to accept first.
    if (row.service_id != null) {
      const [[svc]] = await connection.query(
        `SELECT providerId FROM services WHERE id = ?`,
        [row.service_id]
      );
      if (!svc) {
        await connection.rollback();
        return res.status(404).json({ msg: "Linked service not found." });
      }
      if (svc.providerId !== providerId) {
        await connection.rollback();
        return res.status(403).json({ msg: "You can only accept requests for your own services." });
      }
    }

    if (row.status !== "pending" || row.accepted_provider_id != null) {
      await connection.rollback();
      return res.status(409).json({
        msg: "This request has already been accepted by another provider.",
        status: row.status,
      });
    }

    const [upd] = await connection.query(
      `UPDATE service_requests
       SET status = 'accepted', accepted_provider_id = ?, acceptance_message = ?, updated_at = NOW()
       WHERE id = ? AND status = 'pending' AND accepted_provider_id IS NULL`,
      [providerId, msg, requestId]
    );

    if (upd.affectedRows !== 1) {
      await connection.rollback();
      return res.status(409).json({
        msg: "This request has already been accepted by another provider.",
      });
    }

    const [[providerRow]] = await connection.query(
      `SELECT id, fullName, email, phone FROM users WHERE id = ?`,
      [providerId]
    );

    await connection.commit();

    if (row.user_id) {
      const userMessage = `Your service request "${row.title}" was accepted by ${
        providerRow?.fullName || "a provider"
      }.`;
      await createNotificationsForUsers([row.user_id], {
        type: NOTIFICATION_TYPES.SERVICE_REQUEST_ACCEPTED_USER,
        message: msg ? `${userMessage} Message: ${msg}` : userMessage,
        metadata: {
          serviceRequestId: requestId,
          serviceId: row.service_id,
          providerId,
          providerName: providerRow?.fullName,
          acceptanceMessage: msg,
        },
        dedupeKeyForUser: (uid) => `sr_accepted:${requestId}:user:${uid}`,
      });
    }

    const [[updatedRequest]] = await pool.query(`SELECT * FROM service_requests WHERE id = ?`, [
      requestId,
    ]);

    return res.status(200).json({
      msg: "Request accepted",
      request: updatedRequest,
      provider: providerRow,
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {
      /* ignore */
    }
    console.error("acceptServiceRequest error:", err);
    return res.status(500).json({ msg: "Failed to accept request", error: err.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  ensureServiceRequestTables,
  createRequest,
  getMyRequests,
  getOpenRequests,
  listRequestsRoleBased,
  acceptServiceRequest,
  submitProposal,
  getRequestDetails,
  updateProposalStatus,
  updateRequestStatus,
};
