 if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const Africastalking = require("africastalking");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const util = require("util");
const cron = require("node-cron");
const multer = require("multer");
const path = require("path");
const app = express();
// ---------------- Multer setup for profile pictures ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
// ======================== MIDDLEWARE ========================
const allowedOrigins = [
  "https://www.brightcoveragency.com",
  "https://brightcoveragency.com",
  "https://insure-app-olive.vercel.app",
  "http://localhost:8080"
];

app.use(cors({
  origin: function (origin, callback) {

    // allow server-to-server or curl requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);

    // IMPORTANT: do NOT throw error
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ======================== DATABASE ========================

console.log("ENV:", process.env.NODE_ENV);
console.log("MYSQLHOST exists:", !!process.env.MYSQLHOST);
const isProduction = process.env.NODE_ENV === "production";// Force local mode for development/testing
const db = mysql.createPool({
  host: isProduction ? process.env.MYSQLHOST : process.env.DB_HOST || "localhost",
  user:  isProduction ? process.env.MYSQLUSER : process.env.DB_USER || "root",
  password: isProduction ? process.env.MYSQLPASSWORD : process.env.DB_PASS || "",
  database: isProduction ? process.env.MYSQLDATABASE : process.env.DB_NAME || "InsureApp_db",
  port: isProduction ? process.env.MYSQLPORT : process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  connectTimeout: 60000,
});
const query = util.promisify(db.query).bind(db);
console.log("DB MODE:", isProduction ? "Railway" : "Local");


// ======================== SESSION ========================
const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000, // 15 minutes
    expiration: 8 * 60 * 60 * 1000 // 8 hours
  },
  db
);
app.set("trust proxy", 1); 

app.use(session({
  key: "insureapp_session",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    secure: isProduction,   // secure only in production
    sameSite: isProduction ? "none" : "lax"
  }
}));


// ======================== EMAIL ========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// ======================== AFRICA'S TALKING ========================
// 1. Declare the variable at the top level
let africasTalking;
let sms;

const atCredentials = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
};

// 2. Initialize ONLY if credentials exist
if (atCredentials.apiKey && atCredentials.username) {
    africasTalking = Africastalking(atCredentials);
    sms = africasTalking.SMS; // Access the SMS service here
    console.log("✅ AfricasTalking initialized successfully.");
} else {
    // This prevents the app from crashing even if variables are missing
    console.warn("⚠️ AfricasTalking credentials missing. SMS features will be disabled.");
    
    // Create a "fake" sms object so your code doesn't break when it tries to call it
    sms = {
        send: () => console.error("❌ SMS not sent: AfricasTalking is not configured.")
    };
}

// Now 'sms' is safe to use anywhere in your file!

// ======================== HELPERS ========================
const formatRwandaNumber = number => {
  if (!number) return "";
  let n = String(number).trim();
  if (/^0\d+/.test(n)) n = "+250" + n.slice(1);
  if (/^250\d+/.test(n)) n = "+" + n;
  if (!n.startsWith("+")) n = "+250" + n;
  return n;
};

const logSMS = async (to, message, cost = 0, status = "pending", messageId = "N/A", createdBy = null) => {
  try {
    // If API returns 0.00, we use a standard local rate (e.g., 15 RWF)
    const finalCost = (parseFloat(cost) === 0) ? 15.00 : parseFloat(cost);

    await query(
      `
        INSERT INTO sms_logs
          (phone_number, created_by, message, message_id, cost, delivery_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [to, createdBy, message, messageId, finalCost, status]
    );
  } catch (err) {
    console.error("SMS log error:", err.message);
  }
};

const sendSMS = async (to, message, createdBy = null) => {
  const formatted = formatRwandaNumber(to);
  
  // Africa's Talking configuration options
  const options = {
    to: [formatted],
    message: message,
    from: "Bright-Insurance" // Your approved Sender ID
  };

  try {
    const result = await sms.send(options);
    
    // AT returns an array of recipients
    if (result?.SMSMessageData?.Recipients?.length) {
      const r = result.SMSMessageData.Recipients[0];
      
      // Clean the cost string (e.g., "RWF 15.00" -> 15.00)
      const numericCost = r.cost ? parseFloat(r.cost.replace(/[^0-9.]/g, '')) : 0;

      await logSMS(
        formatted, 
        message, 
        numericCost, 
        r.status, 
        r.messageId,
        createdBy
      );
      
      return { success: r.status === "Success", result: r };
    }
    
    return { success: false, error: "No recipient data returned" };
  } catch (err) {
    console.error("SMS send error:", err);
    await logSMS(formatted, message, 0, "failed", "N/A", createdBy);
    throw err;
  }
};

const calculatePolicyStatus = (expiry_date, updated = false) => {
  if (updated) return "Renewed";
  const today = new Date();
  const expiry = new Date(expiry_date);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays <= 3) return "Expiring Soon";
  return "Active";
};

const isAdminRequest = req => {
  const role = req.session?.userRole ? String(req.session.userRole).toLowerCase() : "";
  return role === "admin";
};

const normalizeActivityScope = value => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["mine", "all"].includes(normalized) ? normalized : "";
};

const getAdminActivityScope = req => {
  const queryScope = normalizeActivityScope(req.query?.scope || req.query?.activity_scope);
  if (queryScope) {
    return queryScope;
  }

  return normalizeActivityScope(req.session?.adminActivityScope) || "all";
};

const getPolicyScope = (req, alias = "") => {
  const prefix = alias ? `${alias}.` : "";
  const scopeMode = isAdminRequest(req) ? getAdminActivityScope(req) : "mine";

  if (scopeMode === "all") {
    return { condition: "", params: [], scopeMode };
  }

  return {
    condition: `${prefix}created_by = ?`,
    params: [req.session.userId],
    scopeMode,
  };
};

const buildWhereClause = (...conditions) => {
  const filtered = conditions.filter(Boolean);
  return filtered.length ? `WHERE ${filtered.join(" AND ")}` : "";
};

const getSessionUserId = req => req.session?.userId || null;
// useractivities
const logUserActivity = async (
  userId,
  type,
  description,
  req
) => {
  try {
    await query(
      `
      INSERT INTO user_activity_logs
      (user_id, activity_type, activity_description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        type,
        description,
        req.ip,
        req.headers["user-agent"]
      ]
    );

    await createNotification({
      targetRole: "Admin",
      activityType: type,
      title: "User Activity",
      message: description,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
};

const createNotification = async ({
  recipientId = null,
  targetRole = "User",
  activityType = "SYSTEM",
  title = "Notification",
  message = "",
  policyId = null,
}) => {
  try {
    await query(
      `
      INSERT INTO notifications
        (recipient_id, target_role, activity_type, title, message, policy_id)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [recipientId, targetRole, activityType, title, message, policyId]
    );
  } catch (err) {
    console.error("Notification insert error:", err);
  }
};

// ======================== TABLES ========================
async function ensureTables() {
  const hasColumn = async (tableName, columnName) => {
    const rows = await query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
    return rows.length > 0;
  };

  const hasIndex = async (tableName, indexName) => {
    const rows = await query(`SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`, [indexName]);
    return rows.length > 0;
  };

  const hasForeignKey = async (tableName, constraintName) => {
    const rows = await query(
      `
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `,
      [tableName, constraintName]
    );

    return rows.length > 0;
  };

  const ensureCreatedByAudit = async ({
    tableName,
    afterColumn,
    indexName,
    constraintName,
    backfillSql = null,
  }) => {
    if (!(await hasColumn(tableName, "created_by"))) {
      await query(`ALTER TABLE \`${tableName}\` ADD COLUMN created_by INT NULL AFTER \`${afterColumn}\``);
    }

    if (backfillSql) {
      await query(backfillSql);
    }

    if (!(await hasIndex(tableName, indexName))) {
      await query(`ALTER TABLE \`${tableName}\` ADD INDEX ${indexName} (created_by)`);
    }

    if (!(await hasForeignKey(tableName, constraintName))) {
      await query(`
        ALTER TABLE \`${tableName}\`
        ADD CONSTRAINT ${constraintName}
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    }
  };

  await query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_picture VARCHAR(255) DEFAULT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'User',
    status VARCHAR(20) DEFAULT 'Active',
    join_date DATE DEFAULT (CURRENT_DATE),
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_users_created_by (created_by),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  if (!(await hasColumn("users", "profile_picture"))) {
    await query("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL AFTER id");
  }

  await ensureCreatedByAudit({
    tableName: "users",
    afterColumn: "join_date",
    indexName: "idx_users_created_by",
    constraintName: "fk_users_created_by",
  });

  await query(`CREATE TABLE IF NOT EXISTS policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    plate VARCHAR(50) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    contact VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_policies_policy_number (policy_number),
    KEY idx_policies_created_by (created_by),
    CONSTRAINT fk_policies_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )`);

  if (!(await hasColumn("policies", "created_by"))) {
    await query("ALTER TABLE policies ADD COLUMN created_by INT NULL AFTER id");
  }

  if (!(await hasColumn("policies", "policy_number"))) {
    await query("ALTER TABLE policies ADD COLUMN policy_number VARCHAR(50) NULL AFTER created_by");
  }

  const policiesMissingNumber = await query(`
    SELECT id, plate
    FROM policies
    WHERE policy_number IS NULL OR TRIM(policy_number) = ''
    ORDER BY id ASC
  `);

  for (const policy of policiesMissingNumber) {
    const preferredNumber = policy.plate ? policy.plate.trim() : "";
    let candidate = preferredNumber || `POL-${String(policy.id).padStart(6, "0")}`;
    let suffix = 1;

    while (true) {
      const duplicate = await query(
        "SELECT id FROM policies WHERE policy_number = ? AND id <> ? LIMIT 1",
        [candidate, policy.id]
      );

      if (!duplicate.length) {
        break;
      }

      candidate = `POL-${String(policy.id).padStart(6, "0")}-${suffix}`;
      suffix += 1;
    }

    await query("UPDATE policies SET policy_number = ? WHERE id = ?", [candidate, policy.id]);
  }

  const duplicatePolicyNumbers = await query(`
    SELECT policy_number
    FROM policies
    WHERE policy_number IS NOT NULL AND TRIM(policy_number) <> ''
    GROUP BY policy_number
    HAVING COUNT(*) > 1
  `);

  for (const duplicate of duplicatePolicyNumbers) {
    const rows = await query(
      "SELECT id FROM policies WHERE policy_number = ? ORDER BY id ASC",
      [duplicate.policy_number]
    );

    for (let i = 1; i < rows.length; i += 1) {
      const candidate = `POL-${String(rows[i].id).padStart(6, "0")}-${i}`;
      await query("UPDATE policies SET policy_number = ? WHERE id = ?", [candidate, rows[i].id]);
    }
  }

  const [{ policiesWithoutNumber }] = await query(`
    SELECT COUNT(*) AS policiesWithoutNumber
    FROM policies
    WHERE policy_number IS NULL OR TRIM(policy_number) = ''
  `);

  if (policiesWithoutNumber === 0) {
    await query("ALTER TABLE policies MODIFY COLUMN policy_number VARCHAR(50) NOT NULL");
  }

  const [fallbackOwner] = await query(`
    SELECT id
    FROM users
    ORDER BY CASE WHEN LOWER(role) = 'admin' THEN 0 ELSE 1 END, id ASC
    LIMIT 1
  `);

  if (fallbackOwner) {
    await query("UPDATE policies SET created_by = ? WHERE created_by IS NULL", [fallbackOwner.id]);
  }

  const [{ policiesWithoutOwner }] = await query(`
    SELECT COUNT(*) AS policiesWithoutOwner
    FROM policies
    WHERE created_by IS NULL
  `);

  if (policiesWithoutOwner === 0) {
    await query("ALTER TABLE policies MODIFY COLUMN created_by INT NOT NULL");
  } else {
    console.warn("Policies without owner remain. created_by was left nullable until users are assigned.");
  }

  if (!(await hasIndex("policies", "uq_policies_policy_number"))) {
    await query("ALTER TABLE policies ADD UNIQUE INDEX uq_policies_policy_number (policy_number)");
  }

  if (!(await hasIndex("policies", "idx_policies_created_by"))) {
    await query("ALTER TABLE policies ADD INDEX idx_policies_created_by (created_by)");
  }

  if (!(await hasForeignKey("policies", "fk_policies_created_by")) && policiesWithoutOwner === 0) {
    await query(`
      ALTER TABLE policies
      ADD CONSTRAINT fk_policies_created_by
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    `);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS followups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      policy_id INT NOT NULL,
      created_by INT NULL,
      followup_status ENUM('confirmed','pending','missed') NOT NULL,
      notes TEXT,
      followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE KEY unique_policy (policy_id),
      KEY idx_followups_created_by (created_by),
      CONSTRAINT fk_followups_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    )
  `);

  await ensureCreatedByAudit({
    tableName: "followups",
    afterColumn: "policy_id",
    indexName: "idx_followups_created_by",
    constraintName: "fk_followups_created_by",
    backfillSql: `
      UPDATE followups f
      JOIN policies p ON p.id = f.policy_id
      SET f.created_by = p.created_by
      WHERE f.created_by IS NULL
    `,
  });

  await query(`CREATE TABLE IF NOT EXISTS password_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100),
    created_by INT NULL,
    otp VARCHAR(6),
    expires_at BIGINT,
    KEY idx_password_otps_created_by (created_by),
    CONSTRAINT fk_password_otps_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  await ensureCreatedByAudit({
    tableName: "password_otps",
    afterColumn: "email",
    indexName: "idx_password_otps_created_by",
    constraintName: "fk_password_otps_created_by",
    backfillSql: `
      UPDATE password_otps po
      JOIN users u ON u.email = po.email
      SET po.created_by = u.id
      WHERE po.created_by IS NULL
    `,
  });

  await query(`CREATE TABLE IF NOT EXISTS sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50),
    created_by INT NULL,
    message TEXT,
    message_id VARCHAR(255),
    cost DECIMAL(10,2) DEFAULT 0,
    delivery_status VARCHAR(100) DEFAULT 'pending',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sms_logs_created_by (created_by),
    CONSTRAINT fk_sms_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`);
  await ensureCreatedByAudit({
    tableName: "sms_logs",
    afterColumn: "phone_number",
    indexName: "idx_sms_logs_created_by",
    constraintName: "fk_sms_logs_created_by",
  });

  await query(`CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NULL,
    target_role ENUM('Admin','User','All') NOT NULL DEFAULT 'User',
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    policy_id INT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notifications_recipient_id (recipient_id),
    KEY idx_notifications_target_role (target_role),
    KEY idx_notifications_policy_id (policy_id),
    CONSTRAINT fk_notifications_recipient_id FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_policy_id FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE SET NULL
  )`);
  await query(`
  CREATE TABLE IF NOT EXISTS policy_history (
    id INT(11) NOT NULL AUTO_INCREMENT,
    policy_id INT(11) NOT NULL,
    created_by INT NULL,
    expiry_date DATE NOT NULL,
    renewed_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY policy_id (policy_id),
    KEY idx_policy_history_created_by (created_by),
    CONSTRAINT fk_ph_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
    CONSTRAINT fk_policy_history_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB
`);
  if (!(await hasForeignKey("policy_history", "fk_ph_policy"))) {
    await query(`
      ALTER TABLE policy_history
      ADD CONSTRAINT fk_ph_policy
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    `);
  }
  await ensureCreatedByAudit({
    tableName: "policy_history",
    afterColumn: "policy_id",
    indexName: "idx_policy_history_created_by",
    constraintName: "fk_policy_history_created_by",
    backfillSql: `
      UPDATE policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      SET ph.created_by = p.created_by
      WHERE ph.created_by IS NULL
    `,
  });
await query(`
  CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT NULL,
    company_name VARCHAR(255) NOT NULL,
    ad_type ENUM('image','text','video') DEFAULT 'text',
    media_url TEXT,
    title VARCHAR(255),
    cta_text VARCHAR(100),
    target_url TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_advertisements_created_by (created_by),
    CONSTRAINT fk_advertisements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);

  await ensureCreatedByAudit({
    tableName: "advertisements",
    afterColumn: "id",
    indexName: "idx_advertisements_created_by",
    constraintName: "fk_advertisements_created_by",
  });


  console.log("✅ Tables ensured");
}

ensureTables().catch(err => { console.error(err); process.exit(1); });

// ======================== AUTH MIDDLEWARE ========================
const isAuthenticated = (req,res,next) => { if(req.session?.userId) return next(); return res.status(401).json({ error:"Unauthorized" }); };
const isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }

  // Convert to lowercase before comparing
  const role = req.session.userRole ? req.session.userRole.toLowerCase() : "";
  
  if (role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  next();
};
// ======================== AUTH ROUTES ========================
// Login / Logout / Me
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // 1. Fetch user by email
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);

    if (!users.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // 2. Check if the status is 'Inactive' (Matching your MariaDB Enum)
    if (user.status === 'Inactive') {
      // 3. Fetch an Admin's phone number for the message
      const admins = await query("SELECT phone FROM users WHERE role = 'Admin' LIMIT 1");
      const adminPhone = (admins.length > 0) ? admins[0].phone : "System Administrator";

      return res.status(403).json({ 
        error: `Account inactive. Please contact Administrators at ${adminPhone} for more information.` 
      });
    }

    // 4. Verify password for 'Active' users
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 5. Successful login: Set session
    req.session.userId = user.id;
    await logUserActivity(
  user.id,
  "LOGIN",
  `${user.name} logged into the system`,
  req
);
    req.session.userRole = user.role;
    req.session.adminActivityScope = user.role?.toLowerCase() === "admin" ? "all" : "mine";

    res.json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/auth/logout", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    await logUserActivity(
      userId,
      "LOGOUT",
      "User logged out",
      req
    );

    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({
          error: "Logout failed"
        });
      }

      res.clearCookie("insureapp_session");

      res.json({
        message: "Logged out"
      });
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.get("/auth/me", isAuthenticated, async (req, res) => {
  try {
    // Fetch user with profile_picture
    const user = await query(
      "SELECT id, name, email, role, status, profile_picture FROM users WHERE id = ?",
      [req.session.userId]
    );

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      ...user[0],
      activity_scope: isAdminRequest(req) ? getAdminActivityScope(req) : "mine"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/activity-scope", isAdmin, (req, res) => {
  res.json({
    scope: getAdminActivityScope(req),
    options: ["mine", "all"],
  });
});

app.put("/admin/activity-scope", isAdmin, (req, res) => {
  const scope = normalizeActivityScope(req.body?.scope);

  if (!scope) {
    return res.status(400).json({ error: "scope must be 'mine' or 'all'" });
  }

  req.session.adminActivityScope = scope;
  res.json({ message: "Activity scope updated", scope });
});
// ======================== USERS CRUD ========================
// ---------------- GET ALL USERS ----------------
app.get("/users", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req);
    const sql = `
      SELECT 
        id, 
        created_by,
        profile_picture, 
        name, 
        email, 
        phone, 
        role, 
        status,
        /* Format join_date, or fallback to created_at if join_date is NULL */
        DATE_FORMAT(IFNULL(join_date, created_at), '%M %d, %Y') AS joined_date,
        DATE_FORMAT(updated_at, '%d %b %Y, %h:%i %p') AS last_update
      FROM users
      ${buildWhereClause(scope.condition)}
      ORDER BY id DESC
    `;
    
    const users = await query(sql, scope.params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------------- GET USER BY ID ----------------
app.get("/users/:id", isAuthenticated, async (req, res) => {
  try {
    const isOwnProfile = req.params.id == req.session.userId;
    const scope = isOwnProfile ? { condition: "", params: [] } : getPolicyScope(req);
    const users = await query(
      `SELECT id, created_by, profile_picture, name, email, phone, role, status,
      DATE_FORMAT(join_date,'%Y-%m-%d') as joined_date,
      DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as created_at,
      DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') as updated_at
      FROM users ${buildWhereClause("id = ?", scope.condition)}`,
      [req.params.id, ...scope.params]
    );
    if (!users.length) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CREATE USER ----------------
app.post("/users", upload.single("profile_picture"), async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const finalRole = role || "User";

    // 1. Basic Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Name, email, password, and phone are required" });
    }

    // 2. CHECK IF PHONE OR EMAIL EXISTS
    const existingUser = await query(
      "SELECT email, phone FROM users WHERE email = ? OR phone = ?", 
      [email, phone]
    );

    if (existingUser.length > 0) {
      const isEmailConflict = existingUser.some(u => u.email === email);
      const conflict = isEmailConflict ? "Email" : "Phone number";
      return res.status(400).json({ error: `${conflict} is already registered.` });
    }

    // 3. Hash Password and Handle File
    const hashed = await bcrypt.hash(password, 10);
    const profile_picture = req.file ? `/uploads/${req.file.filename}` : null;

    // 4. Insert User
    const result = await query(
      "INSERT INTO users (name, email, phone, password, role, profile_picture, created_by) VALUES (?,?,?,?,?,?,?)",
      [name, email, phone, hashed, finalRole, profile_picture, getSessionUserId(req)]
    );

    // 5. SEND EMAIL IN BACKGROUND (Notice: No 'await' here)
    const mailOptions = {
      from: '"System Administrator" <your-email@gmail.com>',
      to: email,
      subject: "Welcome to the System - Your Credentials",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Email: ${email}</p>
          <p>Password: ${password}</p>
          <p>Role: ${finalRole}</p>
        </div>
      `,
    };

    // We do NOT 'await' this. If it fails, the user is still created.
    transporter.sendMail(mailOptions).catch(err => {
      console.error("Email failed background send:", err.message);
    });

    // 6. RESPOND IMMEDIATELY TO FRONTEND
    // This ensures the frontend gets a 201 status right away and shows the toast.
    return res.status(201).json({ 
      id: result.insertId, 
      name, 
      email, 
      role: finalRole,
      message: "User created successfully" 
    });

  } catch (err) {
    console.error("Route Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------- UPDATE USER ----------------
app.put("/users/:id", upload.single("profile_picture"), async (req, res) => {
  try {
    const { name, email, phone, role, status, password } = req.body;
    const updates = [];
    const values = [];

    // 1. Prepare Update Fields
    if (name) { updates.push("name=?"); values.push(name); }
    if (email) { updates.push("email=?"); values.push(email); }
    if (phone) { updates.push("phone=?"); values.push(phone); }
    if (role) { updates.push("role=?"); values.push(role); }
    if (status) { updates.push("status=?"); values.push(status); }
    if (password) { updates.push("password=?"); values.push(await bcrypt.hash(password, 10)); }
    if (req.file) { updates.push("profile_picture=?"); values.push(`/uploads/${req.file.filename}`); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    
    values.push(req.params.id);

    // 2. Fetch current details
    const userResult = await query("SELECT email, name, role FROM users WHERE id=?", [req.params.id]);
    if (!userResult.length) return res.status(404).json({ error: "User not found" });
    const user = userResult[0];

    // 3. Perform the update
    await query(`UPDATE users SET ${updates.join(", ")} WHERE id=?`, values);

    // 4. Send Response IMMEDIATELY to stop the "Loading" state in React
    res.json({ message: "User updated successfully. Notification sending in background." });

    // 5. Send Email in the background (Notice: No 'await' here)
    const recipientEmail = email || user.email;
    const mailOptions = {
      from: '"System Administrator" <your-email@gmail.com>',
      to: recipientEmail,
      subject: "Account Update Notification",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h3 style="color: #333;">Hello ${name || user.name},</h3>
          <p>This is to inform you that your profile information has been updated.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${password ? `<p><strong>Security Notice:</strong> Your password has been updated by the admin.</p>` : ''}
            ${role ? `<p><strong>New Role:</strong> ${role}</p>` : ''}
            ${status ? `<p><strong>Status:</strong> ${status}</p>` : ''}
          </div>
        </div>
      `,
    };

    // Remove 'await' so it doesn't block the response
    transporter.sendMail(mailOptions).catch(err => {
      console.error("Background Email Error:", err);
    });

  } catch (err) {
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});
// ---------------- DEACTIVATE USER ----------------
app.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // 1. Fetch user info AND admin info in parallel (Faster than 2 separate awaits)
    const [userResult, adminResult] = await Promise.all([
      query("SELECT email, name FROM users WHERE id=?", [targetUserId]),
      query("SELECT phone FROM users WHERE role = 'Admin' LIMIT 1")
    ]);
    
    if (!userResult.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = userResult[0];
    const adminPhone = (adminResult.length > 0) ? adminResult[0].phone : "[System Admin Office]";

    // 2. Perform the soft-delete
    await query("UPDATE users SET status='Inactive' WHERE id=?", [targetUserId]);

    // --- KEY CHANGE: RESPOND FIRST ---
    // This tells the React frontend to close the dialog and show "Success" immediately.
    res.json({ message: "User deactivated and notified" });

    // --- BACKGROUND TASK: SEND EMAIL ---
    // We remove the 'await' here so the server processes this while the user is already back at the dashboard.
    transporter.sendMail({
      from: '"System Administrator" <your-email@gmail.com>',
      to: user.email,
      subject: "Important: Your Account has been Deactivated",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #dc2626;">Account Deactivated</h2>
          <p>Hi <b>${user.name}</b>,</p>
          <p>This is to inform you that your account status has been changed to <b>Inactive</b>. You will no longer be able to log in to the system.</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-weight: bold;">Need to reactivate your account?</p>
            <p style="margin: 10px 0 0 0;">Please contact the Administrator at: 
              <span style="color: #2563eb; font-size: 1.1em; font-weight: bold;">${adminPhone}</span>
            </p>
          </div>
          
          <p style="margin-top: 20px; font-size: 0.85em; color: #666;">
            This is an automated notification.
          </p>
        </div>
      `,
    }).catch(emailErr => {
      // Since we already sent the response to the user, we just log errors here.
      console.error("Background Email Error:", emailErr);
    });

  } catch (err) {
    console.error(err);
    // Only send error if the response wasn't already sent above.
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  }
});
// ======================== POLICIES CRUD + SMS ========================
app.get("/policies", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req, "p");

    // Handle userId query parameter for admin viewing specific user's policies
    let additionalCondition = "";
    let additionalParams = [];

    if (req.query.userId && isAdminRequest(req)) {
      additionalCondition = "p.created_by = ?";
      additionalParams = [req.query.userId];
    }

    const sql = `
      SELECT
        p.id,
        p.policy_number,
        p.plate,
        p.owner,
        p.company,
        DATE_FORMAT(p.start_date, '%d-%m-%Y') AS start_date,
        DATE_FORMAT(p.expiry_date, '%d-%m-%Y') AS expiry_date,
        p.contact,
        p.created_by,

        CASE
          -- ✅ RENEWED: policy has been renewed (date changed)
          WHEN EXISTS (
            SELECT 1
            FROM policy_history ph
            WHERE ph.policy_id = p.id
              AND ph.renewed_date IS NOT NULL
          ) THEN 'Renewed'

          -- ❌ EXPIRED (check first!)
          WHEN DATEDIFF(p.expiry_date, CURDATE()) < 0 THEN 'Expired'

          -- ⚠️ EXPIRING SOON (next 3 days)
          WHEN DATEDIFF(p.expiry_date, CURDATE()) <= 3 THEN 'Expiring Soon'

          -- ✅ ACTIVE
          ELSE 'Active'
        END AS status

      FROM policies p
      ${buildWhereClause(scope.condition, additionalCondition)}
      ORDER BY p.expiry_date ASC
    `;

    const policies = await query(sql, [...scope.params, ...additionalParams]);
    res.json(policies);
  } catch (err) {
    console.error("Fetch policies error:", err);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});
app.get("/policies/:id", isAuthenticated, async (req, res) => {
  const scope = getPolicyScope(req);
  const rows = await query(`
    SELECT *,
      CASE
        WHEN DATEDIFF(expiry_date, CURDATE()) < 0 THEN 'Expired'
        WHEN DATEDIFF(expiry_date, CURDATE()) <= 3 THEN 'Expiring Soon'
        ELSE 'Active'
      END AS status
    FROM policies
    ${buildWhereClause("id = ?", scope.condition)}
  `, [req.params.id, ...scope.params]);

  if (!rows.length) {
    return res.status(404).json({ error: "Policy not found" });
  }

  res.json(rows[0]);
});

// POST: Create a new policy
app.post("/policies", isAuthenticated, async (req, res) => {
  try {
    const { policy_number, plate, owner, company, start_date, expiry_date, contact } = req.body;
    const cleanPolicyNumber = policy_number?.trim();
    const cleanPlate = plate?.trim() || " ⛔ Please Update";
    const cleanOwner = owner?.trim();
    const cleanCompany = company?.trim();
    const cleanContact = formatRwandaNumber(contact);

    // Validate required fields
    if (!cleanPolicyNumber || !cleanPlate || !cleanOwner || !cleanCompany || !start_date || !expiry_date || !cleanContact) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingPolicy = await query(
      "SELECT id FROM policies WHERE policy_number = ? LIMIT 1",
      [cleanPolicyNumber]
    );

    if (existingPolicy.length) {
      return res.status(409).json({ error: "Policy number already exists" });
    }

    const result = await query(
      `
        INSERT INTO policies
          (created_by, policy_number, plate, owner, company, start_date, expiry_date, contact)
        VALUES (?,?,?,?,?,?,?,?)
      `,
      [req.session.userId, cleanPolicyNumber, cleanPlate, cleanOwner, cleanCompany, start_date, expiry_date, cleanContact]
    );

    // Optional: send SMS notification
    sendSMS(cleanContact, `Your insurance policy ${cleanPolicyNumber} runs from ${start_date} to ${expiry_date}.`, req.session.userId)
      .catch(console.error);

    await createNotification({
      recipientId: req.session.userId,
      targetRole: "User",
      activityType: "POLICY_CREATED",
      title: "Policy Created",
      message: `Policy ${cleanPolicyNumber} is active from ${start_date} to ${expiry_date}.`,
      policyId: result.insertId,
    });

    res.status(201).json({ id: result.insertId, policy_number: cleanPolicyNumber, message: "Policy created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/policies/:id", isAuthenticated, async (req, res) => {
  const { policy_number, plate, owner, company, contact } = req.body;
  if (req.body.start_date || req.body.expiry_date) {
  return res.status(400).json({
    error: "Use /renew endpoint to change policy dates",
  });
}
  const cleanPolicyNumber = policy_number?.trim();
  const cleanPlate = plate?.trim();
  const cleanOwner = owner?.trim();
  const cleanCompany = company?.trim();
  const cleanContact = formatRwandaNumber(contact);
  const scope = getPolicyScope(req);

  if (!cleanPolicyNumber || !cleanPlate || !cleanOwner || !cleanCompany || !cleanContact) {
    return res.status(400).json({ error: "policy_number, plate, owner, company, and contact are required" });
  }

  const duplicatePolicy = await query(
    "SELECT id FROM policies WHERE policy_number = ? AND id <> ? LIMIT 1",
    [cleanPolicyNumber, req.params.id]
  );

  if (duplicatePolicy.length) {
    return res.status(409).json({ error: "Policy number already exists" });
  }

  const result = await query(`
    UPDATE policies
    SET policy_number=?, plate=?, owner=?, company=?, contact=?, updated_at=NOW()
    ${buildWhereClause("id = ?", scope.condition)}
  `, [cleanPolicyNumber, cleanPlate, cleanOwner, cleanCompany, cleanContact, req.params.id, ...scope.params]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Policy not found" });
  }

  res.json({ message: "Policy updated successfully" });
});
// ======================== DELETE ALL POLICIES (Admin Only) ========================
app.delete("/policies/all", isAdmin, async (req, res) => {
  try {
    const { password } = req.body;

    // 1. Password is required
    if (!password) {
      return res.status(400).json({ error: "Password is required to confirm this action." });
    }

    // 2. Fetch the admin's record from DB
    const admins = await query("SELECT * FROM users WHERE id = ?", [req.session.userId]);
    if (!admins.length) {
      return res.status(404).json({ error: "Admin user not found." });
    }

    const admin = admins[0];

    // 3. Verify the password FIRST before doing anything else
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Action cancelled." });
    }

    // 4. Check if there are any policies to delete
    const [{ total }] = await query("SELECT COUNT(*) AS total FROM policies");
    if (total === 0) {
      return res.status(404).json({ error: "No policies found. Nothing to delete." });
    }

    // 5. Delete dependent records first (foreign key constraints)
    await query("DELETE FROM followups");
    await query("DELETE FROM policy_history");
    await query("DELETE FROM policies");

    // 6. Reset auto increment
    await query("ALTER TABLE policies AUTO_INCREMENT = 1");
    await query("ALTER TABLE policy_history AUTO_INCREMENT = 1");
    await query("ALTER TABLE followups AUTO_INCREMENT = 1");

    console.log(`🗑️  ${total} policies deleted by Admin: ${admin.email} at ${new Date().toISOString()}`);

  createNotification({
  recipientId: null,
  targetRole: "Admin",
  activityType: "POLICY_BULK_DELETED",
  title: "⚠️ All Policies Deleted",
  message: `Admin ${admin.email} permanently deleted all ${total} policies on ${new Date().toISOString()}.`,
  policyId: null,
}).catch(console.error);

logUserActivity(
  req.session.userId,
  "POLICY_BULK_DELETED",
  `Admin permanently deleted all ${total} policies`,
  req
).catch(console.error);
    res.json({ 
      message: `All policies have been permanently deleted.`,
      deleted: total
    });

  } catch (err) {
    console.error("Delete all policies error:", err);
    res.status(500).json({ error: "Failed to delete policies: " + err.message });
  }
});

// PUT: Renew policy and log history

// AFTER
app.delete("/policies/:id", isAdmin, async (req, res) => {
  try {
    // 1. Fetch policy before deleting (so we have its data for the notification)
    const [policy] = await query(
      "SELECT id, policy_number, plate, owner, contact, created_by FROM policies WHERE id = ?",
      [req.params.id]
    );

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    // 2. Delete it
    await query("DELETE FROM policies WHERE id = ?", [req.params.id]);

    // 3. Notify the policy owner (non-blocking)
    createNotification({
      recipientId: policy.created_by,
      targetRole: "User",
      activityType: "POLICY_DELETED",
      title: "Policy Deleted",
      message: `Policy ${policy.policy_number} (Plate: ${policy.plate}, Owner: ${policy.owner}) has been permanently deleted by an administrator.`,
      policyId: null, // policy is gone, don't reference it
    }).catch(console.error);

    // 4. Notify all admins as well
    createNotification({
      recipientId: null,
      targetRole: "Admin",
      activityType: "POLICY_DELETED",
      title: "Policy Deleted by Admin",
      message: `Admin deleted policy ${policy.policy_number} (${policy.plate} — ${policy.owner}).`,
      policyId: null,
    }).catch(console.error);

    // 5. Send SMS to the policy contact (non-blocking)
    if (policy.contact) {
      sendSMS(
        policy.contact,
        `Dear ${policy.owner}, your insurance policy ${policy.policy_number} has been removed from our system. Contact us for details.`,
        req.session.userId
      ).catch(console.error);
    }

    // 6. Log admin activity
    logUserActivity(
      req.session.userId,
      "POLICY_DELETED",
      `Admin deleted policy ${policy.policy_number} (Plate: ${policy.plate})`,
      req
    ).catch(console.error);

    res.json({ message: "Policy deleted and notifications sent" });
  } catch (err) {
    console.error("Delete policy error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});
// ======================== DASHBOARD / STATS ========================
app.get("/api/summary", isAuthenticated, async (req, res) => {
  const scope = getPolicyScope(req);
  const stats = await query(`
    SELECT
      COUNT(*) AS created,

      SUM(CASE
        WHEN EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) THEN 1 ELSE 0
      END) AS renewed,

      SUM(CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) AND DATEDIFF(p.expiry_date, CURDATE()) > 3 THEN 1 ELSE 0
      END) AS active,

      SUM(CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) AND DATEDIFF(p.expiry_date, CURDATE()) BETWEEN 0 AND 3 THEN 1 ELSE 0
      END) AS expiring,

      SUM(CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) AND DATEDIFF(p.expiry_date, CURDATE()) < 0 THEN 1 ELSE 0
      END) AS expired

    FROM policies p
    ${buildWhereClause(scope.condition)}
  `, scope.params);

  res.json(stats[0]);
});
app.get("/api/trends", isAuthenticated, async (req, res) => {
  const scope = getPolicyScope(req);
  const results = await query(`
    SELECT
      DATE_FORMAT(p.expiry_date, '%b %Y') AS month,

      SUM(CASE
        WHEN EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) THEN 1 ELSE 0
      END) AS renewed,

      SUM(CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) AND DATEDIFF(p.expiry_date, CURDATE()) > 3 THEN 1 ELSE 0
      END) AS active,

      SUM(CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM policy_history ph
          WHERE ph.policy_id = p.id AND ph.renewed_date IS NOT NULL
        ) AND DATEDIFF(p.expiry_date, CURDATE()) < 0 THEN 1 ELSE 0
      END) AS expired,

      COUNT(*) AS total

    FROM policies p
    ${buildWhereClause(scope.condition)}
    GROUP BY month
    ORDER BY MIN(p.expiry_date) DESC
    LIMIT 12
  `, scope.params);

  res.json({ trends: results });
});
app.get("/api/company-distribution", isAuthenticated, async (req,res)=>{
  const scope = getPolicyScope(req);
  const results = await query(
    `SELECT company AS name, COUNT(*) AS value FROM policies ${buildWhereClause(scope.condition)} GROUP BY company`,
    scope.params
  );
  const colors = ["hsl(var(--primary))","hsl(var(--success))","hsl(var(--warning))","hsl(var(--destructive))"];
  const data = results.map((r,i)=>({...r,color:colors[i%colors.length]}));
  res.json(data);
});
app.get("/api/sidebar-counts", isAuthenticated, async (req,res)=>{
  const scope = getPolicyScope(req);
  const results = await query(
    `
      SELECT
        (SELECT COUNT(*) FROM policies ${buildWhereClause(scope.condition)}) AS policies,
        ${isAdminRequest(req) ? "(SELECT COUNT(*) FROM users)" : "1"} AS users
    `,
    scope.params
  );
  res.json(results[0]||{ policies:0, users:0 });
});

// ======================== EMAIL OTP / RESET ========================
app.post("/auth/send-otp", async (req,res)=>{ const { email } = req.body; if(!email) return res.status(400).json({ error:"Email required" }); const users = await query("SELECT id FROM users WHERE email=?",[email]); if(!users.length) return res.status(404).json({ error:"Email not registered" }); const otp = crypto.randomInt(100000,999999).toString(); const expires = Date.now() + 5*60*1000; await query("DELETE FROM password_otps WHERE email=?",[email]); await query("INSERT INTO password_otps (email,created_by,otp,expires_at) VALUES (?,?,?,?)",[email,users[0].id,otp,expires]); await transporter.sendMail({from:`"InsureApp Support" <${process.env.SMTP_USER}>`,to:email,subject:"Password Reset OTP",html:`<h2>Password Reset</h2><p>Your OTP is:</p><h1>${otp}</h1><p>Expires in 5 minutes.</p>`}); res.json({ message:"OTP sent to email" }); });
app.post("/auth/verify-otp", async (req,res)=>{ const { email, otp } = req.body; if(!email||!otp) return res.status(400).json({ error:"Missing data" }); const rows = await query("SELECT * FROM password_otps WHERE email=? AND otp=?",[email,otp]); if(!rows.length) return res.status(400).json({ error:"Invalid OTP" }); if(rows[0].expires_at < Date.now()) return res.status(400).json({ error:"OTP expired" }); res.json({ message:"OTP verified" }); });
app.post("/auth/reset-password", async (req,res)=>{ const { email, password } = req.body; if(!email||!password) return res.status(400).json({ error:"Missing data" }); const hashed = await bcrypt.hash(password,10); await query("UPDATE users SET password=? WHERE email=?",[hashed,email]); await query("DELETE FROM password_otps WHERE email=?",[email]); res.json({ message:"Password updated successfully" }); });

// ======================== EXPIRY REPORT ========================
app.get("/api/expiry-report", isAuthenticated, async (req, res) => {
  try {
    const { company = "all" } = req.query;
    const scope = getPolicyScope(req, "p");
    const sharedConditions = [scope.condition];
    const sharedParams = [...scope.params];

    if (company !== "all") {
      sharedConditions.push("p.company = ?");
      sharedParams.push(company);
    }

    const baseSelect = `
      SELECT 
        p.id,
        p.policy_number,
        p.plate,
        p.owner,
        p.company,
        p.contact,
        DATE_FORMAT(p.start_date, '%d-%m-%Y') AS startDate,
        DATE_FORMAT(p.expiry_date, '%d-%m-%Y') AS expiryDate,
        DATEDIFF(p.expiry_date, CURDATE()) AS days_remaining,
        CASE 
          WHEN DATEDIFF(p.expiry_date, CURDATE()) < 0 
          THEN ABS(DATEDIFF(p.expiry_date, CURDATE()))
          ELSE 0
        END AS days_overdue,
        f.followup_status
      FROM policies p
      LEFT JOIN followups f ON p.id = f.policy_id
    `;

    // 1️⃣ Expired policies
    const fetchExpiryGroup = (dateCondition, sortDirection = "ASC") => query(`
      ${baseSelect}
      ${buildWhereClause(dateCondition, ...sharedConditions)}
      ORDER BY p.expiry_date ${sortDirection}
    `, sharedParams);

    const expired = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) < 0", "DESC");

    // 2️⃣ Expiring today
    const today = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) = 0");

    // 3️⃣ Expiring this week (1–7 days)
    const week = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) BETWEEN 1 AND 7");

    // 4️⃣ Expiring this month (8–29 days)
    const month = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) BETWEEN 8 AND 29");

    // 5️⃣ Exact 30-day reminder
    const thirtyDays = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) = 30");

    // 6️⃣ Upcoming future (31–364 days)
    const nextMonth = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) BETWEEN 31 AND 364");

    // 7️⃣ Exact 365-day reminder
    const yearly = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) = 365");

    // 8️⃣ Beyond one year
    const nextAnnual = await fetchExpiryGroup("DATEDIFF(p.expiry_date, CURDATE()) > 365");

    res.json({
      expired,
      today,
      week,
      month,
      thirtyDays,
      nextMonth,
      yearly,
      nextAnnual
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// ======================== SMS LOGS ========================
app.get("/sms/logs", isAuthenticated, async (req,res)=>{ // Added 'cost' to the SELECT statement
const scope = getPolicyScope(req); const logs = await query(`SELECT id, phone_number, created_by, message, cost, delivery_status, is_read, created_at FROM sms_logs ${buildWhereClause(scope.condition)} ORDER BY created_at DESC LIMIT 20`, scope.params); const unread = logs.filter(l=>l.is_read===0).length; res.json({ logs, unread, scope: scope.scopeMode }); });
app.put("/sms/mark-read", isAuthenticated, async (req,res)=>{ const scope = getPolicyScope(req); await query(`UPDATE sms_logs SET is_read = 1 ${buildWhereClause("is_read = 0", scope.condition)}`, scope.params); res.json({ message:"Notifications marked as read" }); });
app.put("/sms/mark-unread/:id", isAuthenticated, async (req,res)=>{ const scope = getPolicyScope(req); await query(`UPDATE sms_logs SET is_read=0 ${buildWhereClause("id = ?", scope.condition)}`,[req.params.id, ...scope.params]); res.json({ message:"Marked as unread" }); });
app.delete("/sms/delete/:id", isAuthenticated, async (req,res)=>{ const scope = getPolicyScope(req); await query(`DELETE FROM sms_logs ${buildWhereClause("id = ?", scope.condition)}`,[req.params.id, ...scope.params]); res.json({ message:"Deleted" }); });
// Add this to your backend
app.put("/sms/logs/:id/read", isAuthenticated, async (req,res)=>{ 
  const scope = getPolicyScope(req);
  await query(`UPDATE sms_logs SET is_read = 1 ${buildWhereClause("id = ?", scope.condition)}`, [req.params.id, ...scope.params]); 
  res.json({ message: "Marked as read" }); 
});

// ======================== SYSTEM NOTIFICATIONS ========================
app.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const role = isAdminRequest(req) ? 'Admin' : 'User';
    const scope = isAdminRequest(req)
      ? `(target_role = 'Admin' OR target_role = 'All' OR recipient_id = ?)`
      : `(target_role IN ('User', 'All') OR recipient_id = ?)`;

    const notifications = await query(
      `
      SELECT id, recipient_id, target_role, activity_type, title, message, policy_id, is_read, created_at
      FROM notifications
      WHERE ${scope}
      ORDER BY created_at DESC
      LIMIT 30
      `,
      [req.session.userId]
    );

    const unread = notifications.filter(n => n.is_read === 0).length;
    res.json({ notifications, unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/notifications/mark-read", isAuthenticated, async (req, res) => {
  try {
    const condition = isAdminRequest(req)
      ? `(target_role = 'Admin' OR target_role = 'All' OR recipient_id = ?)`
      : `(target_role IN ('User', 'All') OR recipient_id = ?)`;

    await query(
      `UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND ${condition}`,
      [req.session.userId]
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/notifications/:id/read", isAuthenticated, async (req, res) => {
  try {
    const condition = isAdminRequest(req)
      ? `(target_role = 'Admin' OR target_role = 'All' OR recipient_id = ?)`
      : `(target_role IN ('User', 'All') OR recipient_id = ?)`;

    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND ${condition}`,
      [req.params.id, req.session.userId]
    );

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily policy expiry checks...");

  try {
    // ─────────────────────────────────────────────
    // 1. EXPIRED policies (past expiry date)
    // ─────────────────────────────────────────────
    const expired = await query(`
      SELECT id, policy_number, plate, owner, contact, expiry_date, created_by
      FROM policies
      WHERE DATEDIFF(expiry_date, CURDATE()) < 0
    `);

    for (const p of expired) {
      // 1a. Deduplicated notification — only one per policy per day
      const [existingNotif] = await query(`
        SELECT id FROM notifications
        WHERE policy_id = ?
          AND activity_type = 'POLICY_EXPIRED'
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [p.id]);

      if (!existingNotif) {
        // Notify the policy owner
        await createNotification({
          recipientId: p.created_by,
          targetRole: "User",
          activityType: "POLICY_EXPIRED",
          title: "Policy Expired",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expired on ${p.expiry_date}. Please renew it as soon as possible.`,
          policyId: p.id,
        });

        // Notify admins separately
        await createNotification({
          recipientId: null,
          targetRole: "Admin",
          activityType: "POLICY_EXPIRED",
          title: "Policy Expired",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expired on ${p.expiry_date}.`,
          policyId: p.id,
        });
      }

      // 1b. SMS — deduplicated via sms_logs (only one SMS per policy per day)
      const [smsSentToday] = await query(`
        SELECT id FROM sms_logs
        WHERE phone_number = ?
          AND message LIKE ?
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [formatRwandaNumber(p.contact), `%${p.policy_number}%expired%`]);

      if (!smsSentToday) {
        sendSMS(
          p.contact,
          `Dear ${p.owner}, your insurance policy ${p.policy_number} (${p.plate}) expired on ${p.expiry_date}. Please contact us to renew immediately.`,
          p.created_by || null
        ).catch(console.error);
      }

      // 1c. Log to policy_history (safe upsert)
      await query(`
        INSERT INTO policy_history (policy_id, created_by, expiry_date)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM policy_history
          WHERE policy_id = ? AND expiry_date = ? AND renewed_date IS NULL
        )
      `, [p.id, p.created_by || null, p.expiry_date, p.id, p.expiry_date]);
    }

    // ─────────────────────────────────────────────
    // 2. EXPIRING TODAY (0 days)
    // ─────────────────────────────────────────────
    const expiringToday = await query(`
      SELECT id, policy_number, plate, owner, contact, expiry_date, created_by
      FROM policies
      WHERE DATEDIFF(expiry_date, CURDATE()) = 0
    `);

    for (const p of expiringToday) {
      const [exists] = await query(`
        SELECT id FROM notifications
        WHERE policy_id = ?
          AND activity_type = 'POLICY_EXPIRES_TODAY'
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [p.id]);

      if (!exists) {
        await createNotification({
          recipientId: p.created_by,
          targetRole: "User",
          activityType: "POLICY_EXPIRES_TODAY",
          title: "⚠️ Policy Expires Today",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expires TODAY. Renew now to avoid a lapse in coverage.`,
          policyId: p.id,
        });

        await createNotification({
          recipientId: null,
          targetRole: "Admin",
          activityType: "POLICY_EXPIRES_TODAY",
          title: "⚠️ Policy Expires Today",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expires today.`,
          policyId: p.id,
        });
      }

      sendSMS(
        p.contact,
        `Dear ${p.owner}, your insurance policy ${p.policy_number} (${p.plate}) expires TODAY (${p.expiry_date}). Please renew immediately to stay covered.`,
        p.created_by || null
      ).catch(console.error);
    }

    // ─────────────────────────────────────────────
    // 3. EXPIRING SOON (1–3 days)
    // ─────────────────────────────────────────────
    const expiringSoon = await query(`
      SELECT id, policy_number, plate, owner, contact, expiry_date, created_by,
             DATEDIFF(expiry_date, CURDATE()) AS days_left
      FROM policies
      WHERE DATEDIFF(expiry_date, CURDATE()) BETWEEN 1 AND 3
    `);

    for (const p of expiringSoon) {
      const [exists] = await query(`
        SELECT id FROM notifications
        WHERE policy_id = ?
          AND activity_type = 'POLICY_EXPIRING_SOON'
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [p.id]);

      if (!exists) {
        await createNotification({
          recipientId: p.created_by,
          targetRole: "User",
          activityType: "POLICY_EXPIRING_SOON",
          title: "Policy Expiring Soon",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expires in ${p.days_left} day(s) on ${p.expiry_date}. Please arrange renewal.`,
          policyId: p.id,
        });

        await createNotification({
          recipientId: null,
          targetRole: "Admin",
          activityType: "POLICY_EXPIRING_SOON",
          title: "Policy Expiring Soon",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expires in ${p.days_left} day(s).`,
          policyId: p.id,
        });
      }

      // SMS for expiring soon (only once per policy per day)
      const [smsSent] = await query(`
        SELECT id FROM sms_logs
        WHERE phone_number = ?
          AND message LIKE ?
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [formatRwandaNumber(p.contact), `%${p.policy_number}%${p.days_left} day%`]);

      if (!smsSent) {
        sendSMS(
          p.contact,
          `Dear ${p.owner}, your insurance policy ${p.policy_number} (${p.plate}) expires in ${p.days_left} day(s) on ${p.expiry_date}. Please renew to avoid interruption.`,
          p.created_by || null
        ).catch(console.error);
      }
    }

    // ─────────────────────────────────────────────
    // 4. 30-DAY ADVANCE REMINDER
    // ─────────────────────────────────────────────
    const thirtyDay = await query(`
      SELECT id, policy_number, plate, owner, contact, expiry_date, created_by
      FROM policies
      WHERE DATEDIFF(expiry_date, CURDATE()) = 30
    `);

    for (const p of thirtyDay) {
      const [exists] = await query(`
        SELECT id FROM notifications
        WHERE policy_id = ?
          AND activity_type = 'POLICY_30DAY_REMINDER'
          AND DATE(created_at) = CURDATE()
        LIMIT 1
      `, [p.id]);

      if (!exists) {
        await createNotification({
          recipientId: p.created_by,
          targetRole: "User",
          activityType: "POLICY_30DAY_REMINDER",
          title: "30-Day Renewal Reminder",
          message: `Policy ${p.policy_number} (${p.plate} — ${p.owner}) expires in 30 days on ${p.expiry_date}. Start your renewal process early.`,
          policyId: p.id,
        });
      }

      sendSMS(
        p.contact,
        `Dear ${p.owner}, this is an advance reminder: your insurance policy ${p.policy_number} (${p.plate}) expires in 30 days on ${p.expiry_date}. Contact us to renew early.`,
        p.created_by || null
      ).catch(console.error);
    }

    console.log(`✅ Daily checks done — Expired: ${expired.length}, Today: ${expiringToday.length}, Soon: ${expiringSoon.length}, 30-day: ${thirtyDay.length}`);

  } catch (err) {
    console.error("❌ Cron job error:", err);
  }
});

app.put("/policies/:id/renew", isAuthenticated, async (req, res) => {
  const { start_date, expiry_date, contact } = req.body;
  const policyId = req.params.id;
  const scope = getPolicyScope(req);
  const cleanContact = formatRwandaNumber(contact);

  if (!start_date || !expiry_date || !cleanContact) {
    return res.status(400).json({ error: "start_date, expiry_date, and contact are required" });
  }

  const [current] = await query(
    `
      SELECT start_date, expiry_date, policy_number
      FROM policies
      ${buildWhereClause("id = ?", scope.condition)}
    `,
    [policyId, ...scope.params]
  );

  if (!current) {
    return res.status(404).json({ error: "Policy not found" });
  }

  // Save old expiry
  await query(`
    INSERT INTO policy_history (policy_id, created_by, expiry_date, renewed_date)
    VALUES (?, ?, ?, ?)
  `, [policyId, req.session.userId, current.expiry_date, start_date]);

  // Update policy dates
  await query(`
    UPDATE policies
    SET start_date=?, expiry_date=?, contact=?, updated_at=NOW()
    ${buildWhereClause("id = ?", scope.condition)}
  `, [start_date, expiry_date, cleanContact, policyId, ...scope.params]);

  sendSMS(cleanContact, `Your policy ${current.policy_number} was renewed until ${expiry_date}`, req.session.userId)
    .catch(console.error);

  await createNotification({
    recipientId: req.session.userId,
    targetRole: "User",
    activityType: "POLICY_RENEWED",
    title: "Policy Renewed",
    message: `Policy ${current.policy_number} was renewed until ${expiry_date}.`,
    policyId: policyId,
  });

  res.json({ message: "Policy renewed successfully" });
});

// ======================== POLICY HISTORY ROUTES ========================

// 1️⃣ Get all policy history (optional date filter)
app.get("/api/policy-history", isAuthenticated, async (req, res) => {
  const { start, end } = req.query;
  try {
    const scope = getPolicyScope(req, "p");
    let sql = `
      SELECT ph.id, ph.policy_id, ph.created_by, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.policy_number, p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
    `;
    const conditions = [scope.condition];
    const params = [...scope.params];

    if (start && end) {
      conditions.push("(ph.expiry_date BETWEEN ? AND ? OR ph.renewed_date BETWEEN ? AND ?)");
      params.push(start, end, start, end);
    }

    sql += ` ${buildWhereClause(...conditions)} ORDER BY ph.expiry_date DESC`;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Get history for a specific policy
app.get("/api/policy-history/:policyId", isAuthenticated, async (req, res) => {
  const { policyId } = req.params;
  const id = parseInt(policyId);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid policy ID" });
  }
  try {
    const scope = getPolicyScope(req, "p");
    const rows = await query(`
      SELECT ph.id, ph.policy_id, ph.created_by, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.policy_number, p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      ${buildWhereClause("ph.policy_id = ?", scope.condition)}
      ORDER BY ph.expiry_date DESC
    `, [id, ...scope.params]);

    res.json(rows);
  } catch (err) {
    console.error("Policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Get only expired policies (not yet renewed)
app.get("/api/policy-history/expired", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req, "p");
    const rows = await query(`
      SELECT ph.id, ph.policy_id, ph.created_by, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.policy_number, p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      ${buildWhereClause("ph.renewed_date IS NULL", scope.condition)}
      ORDER BY ph.expiry_date DESC
    `, scope.params);

    res.json(rows);
  } catch (err) {
    console.error("Expired policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ======================== FOLLOW UPS ========================

// CREATE or UPDATE follow-up
// ======================== FOLLOW-UPS ========================
app.post("/api/followup", isAuthenticated, async (req, res) => {
  try {
    const { policy_id, followup_status, notes } = req.body;

    if (!policy_id || !followup_status) {
      return res.status(400).json({
        error: "policy_id and followup_status are required",
      });
    }

    if (!["confirmed", "pending", "missed"].includes(followup_status)) {
      return res.status(400).json({
        error: "Invalid followup_status value",
      });
    }

    const scope = getPolicyScope(req, "p");
    const policy = await query(
      `
        SELECT p.id
        FROM policies p
        ${buildWhereClause("p.id = ?", scope.condition)}
        LIMIT 1
      `,
      [policy_id, ...scope.params]
    );

    if (!policy.length) {
      return res.status(404).json({ error: "Policy not found" });
    }

    await query(
      `
      INSERT INTO followups (policy_id, created_by, followup_status, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        created_by = VALUES(created_by),
        followup_status = VALUES(followup_status),
        notes = VALUES(notes),
        followed_at = CURRENT_TIMESTAMP
      `,
      [policy_id, req.session.userId, followup_status, notes || null]
    );

    res.json({ message: "Follow-up saved successfully" });
  } catch (err) {
    console.error("Follow-up error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all follow-ups with policy details
app.get("/api/followup", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req, "p");
    const rows = await query(`
      SELECT
        f.id,
        f.created_by,
        f.followup_status,
        f.followed_at,

        p.id AS policy_id,
        p.policy_number,
        p.plate,
        p.owner,
        p.company,
        DATE_FORMAT(p.expiry_date, '%Y-%m-%d') AS expiryDate,
        p.contact
      FROM followups f
      JOIN policies p ON p.id = f.policy_id
      ${buildWhereClause(scope.condition)}
      ORDER BY f.followed_at DESC
    `, scope.params);

    res.json(rows);
  } catch (err) {
    console.error("Fetch follow-ups error:", err);
    res.status(500).json({ error: err.message });
  }
});
//
// ---------------- CLEAR  status ----------------
app.delete("/api/followup/:policy_id", isAuthenticated, async (req, res) => {
  try {
    const { policy_id } = req.params;
    const scope = getPolicyScope(req, "p");
    const policy = await query(
      `
        SELECT p.id
        FROM policies p
        ${buildWhereClause("p.id = ?", scope.condition)}
        LIMIT 1
      `,
      [policy_id, ...scope.params]
    );

    if (!policy.length) {
      return res.status(404).json({ error: "Policy not found" });
    }

    await query("DELETE FROM followups WHERE policy_id = ?", [policy_id]);
    res.json({ message: "Follow-up status cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const backfillPolicyHistory = async () => {
  try {
    const expired = await query(`
      SELECT id, policy_number, plate, contact, expiry_date, created_by
      FROM policies
      WHERE expiry_date <= CURDATE()
    `);

    for (const p of expired) {
      await query(`
        INSERT INTO policy_history (policy_id, created_by, expiry_date)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM policy_history
          WHERE policy_id = ? AND expiry_date = ?
        )
      `, [p.id, p.created_by || null, p.expiry_date, p.id, p.expiry_date]);
    }

    console.log("✅ Expired policies added to policy_history");
  } catch (err) {
    console.error(err);
  }
};

// Call the async function
backfillPolicyHistory();
//send message 
app.post("/api/policies/broadcast", isAuthenticated, async (req, res) => {
  const { template, recipients } = req.body;

  if (!template || !recipients || !recipients.length) {
    return res.status(400).json({ error: "No recipients or message content provided." });
  }

  // Tracking results for the response
  let sentCount = 0;
  let errorCount = 0;

  try {
    // Process messages in parallel for speed
    await Promise.all(recipients.map(async (client) => {
      try {
        // Replace tags with actual data
        const personalizedMessage = template
          .replace(/{owner}/g, client.owner || "Client")
          .replace(/{policy_number}/g, client.policy_number || client.plate || "your policy")
          .replace(/{plate}/g, client.policy_number || client.plate || "your policy")
          .replace(/{days}/g, client.days || "0");

        // Use your existing sendSMS helper
        const result = await sendSMS(client.contact, personalizedMessage, req.session.userId);
        if (result.success) sentCount++;
        else errorCount++;
      } catch (err) {
        console.error(`Failed to send to ${client.contact}:`, err.message);
        errorCount++;
      }
    }));

    res.json({
      message: "Broadcast process completed",
      summary: { total: recipients.length, successful: sentCount, failed: errorCount }
    });
  } catch (err) {
    res.status(500).json({ error: "Critical broadcast failure: " + err.message });
  }
});
// import policies cvs 
// POST /policies/import
app.post("/policies/import", isAuthenticated, async (req, res) => {
  const { policies } = req.body;
  const canManageAllPolicies = isAdminRequest(req);

  if (!Array.isArray(policies) || policies.length === 0) {
    return res.status(400).json({ success: false, message: "You must upload at least one policy." });
  }

  const insertedRows = [];
  const updatedRows = []; // Track updates separately
  const skippedRows = [];

  for (let i = 0; i < policies.length; i++) {
    try {
      let { policy_number, plate, owner, company, start_date, expiry_date, contact } = policies[i];

      const cleanPolicyNumber = policy_number?.trim();
      const cleanPlate = plate?.trim() || "⛔ Please Update";
      const cleanOwner = owner?.trim();
      const cleanCompany = company?.trim().toUpperCase();
      const cleanContact = formatRwandaNumber(contact);

      // 1. Validation Logic (Keep this as is)
      const missingFields = [];
      if (!cleanPolicyNumber) missingFields.push("policy_number");
      if (!cleanPlate) missingFields.push("plate");
      if (!cleanOwner) missingFields.push("owner");
      if (!cleanCompany) missingFields.push("company");
      if (!start_date) missingFields.push("start_date");
      if (!expiry_date) missingFields.push("expiry_date");
      if (!cleanContact) missingFields.push("contact");

      if (missingFields.length > 0) {
        skippedRows.push({ row: i + 1, reason: `Missing: ${missingFields.join(", ")}`, data: policies[i] });
        continue;
      }

      // 2. Check if the policy number already exists
      const existing = await query(
        "SELECT id, created_by FROM policies WHERE policy_number = ? LIMIT 1",
        [cleanPolicyNumber]
      );

      if (existing.length > 0) {
        if (!canManageAllPolicies && existing[0].created_by !== req.session.userId) {
          skippedRows.push({
            row: i + 1,
            reason: `Policy number ${cleanPolicyNumber} already belongs to another user`,
            data: policies[i]
          });
          continue;
        }

        // ----- UPDATE EXISTING POLICY -----
        await query(
          `UPDATE policies 
           SET plate = ?, owner = ?, company = ?, start_date = ?, expiry_date = ?, contact = ?
           WHERE policy_number = ?`,
          [cleanPlate, cleanOwner, cleanCompany, start_date, expiry_date, cleanContact, cleanPolicyNumber]
        );
        updatedRows.push({ row: i + 1, policy_number: cleanPolicyNumber, status: "updated" });
      } else {
        // ----- INSERT NEW POLICY -----
        const result = await query(
          `
            INSERT INTO policies
              (created_by, policy_number, plate, owner, company, start_date, expiry_date, contact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [req.session.userId, cleanPolicyNumber, cleanPlate, cleanOwner, cleanCompany, start_date, expiry_date, cleanContact]
        );
        insertedRows.push({ row: i + 1, id: result.insertId, policy_number: cleanPolicyNumber });
      }

    } catch (err) {
      skippedRows.push({ row: i + 1, reason: "Database error: " + err.message, data: policies[i] });
    }
  }

  // 3. Build a smart summary message
  const totalProcessed = insertedRows.length + updatedRows.length;
  let summary = `Processed ${totalProcessed} policies. (${insertedRows.length} new, ${updatedRows.length} updated).`;
  if (skippedRows.length > 0) summary += ` ${skippedRows.length} rows skipped.`;

  res.json({
    success: true,
    message: summary,
    totalRows: policies.length,
    inserted: insertedRows.length,
    updated: updatedRows.length,
    skipped: skippedRows.length,
    skippedRows
  });
});
// --- ADVERTISEMENT SYSTEM API ---

/**
 * 1. CREATE: Add a new company advertisement
 */
// Use 'upload.single("media")' for one file input named "media"
app.post("/api/ads", isAuthenticated, upload.single("media"), async (req, res) => {
  const { company_name, ad_type = "image", title, cta_text = "Learn More", target_url } = req.body;
  let media_url = req.body.media_url; // fallback if no file uploaded

  // If a file is uploaded, override media_url
  if (req.file) {
    media_url = `/uploads/${req.file.filename}`;
  }

  if (!company_name || !media_url) {
    return res.status(400).json({ error: "company_name and media_url are required" });
  }

  try {
    const result = await query(
      `INSERT INTO advertisements 
       (created_by, company_name, ad_type, media_url, title, cta_text, target_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [getSessionUserId(req), company_name, ad_type, media_url, title, cta_text, target_url]
    );

    const ad = await query("SELECT * FROM advertisements WHERE id = ?", [result.insertId]);
    res.status(201).json(ad[0]);
  } catch (err) {
    console.error("Create ad error:", err);
    res.status(500).json({ error: "Failed to create advertisement" });
  }
});

app.get("/api/ads", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req);
    const ads = await query(
      `SELECT * FROM advertisements ${buildWhereClause(scope.condition)} ORDER BY created_at DESC`,
      scope.params
    );
    res.json(ads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});
app.get("/api/ads/random", async (req, res) => {
  try {
    const ads = await query(
      "SELECT * FROM advertisements WHERE is_active = 1 ORDER BY RAND() LIMIT 1"
    );

    res.json(ads[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ad" });
  }
});
app.patch("/api/ads/:id/status", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const scope = getPolicyScope(req);
    await query(
      `UPDATE advertisements SET is_active = ? ${buildWhereClause("id = ?", scope.condition)}`,
      [is_active ? 1 : 0, id, ...scope.params]
    );

    res.json({ message: "Ad status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update ad status" });
  }
});
app.delete("/api/ads/:id", isAuthenticated, async (req, res) => {
  try {
    const scope = getPolicyScope(req);
    await query(
      `DELETE FROM advertisements ${buildWhereClause("id = ?", scope.condition)}`,
      [req.params.id, ...scope.params]
    );
    res.json({ message: "Ad deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});
// --- ADMIN ACTIVITY SUMMARY ---
app.get("/api/admin/activity-summary", isAdmin, async (req, res) => {
  try {

    const [users] = await query(`
      SELECT COUNT(*) AS totalUsers
      FROM users
    `);

    const [policies] = await query(`
      SELECT COUNT(*) AS totalPolicies
      FROM policies
    `);

    const [activeToday] = await query(`
      SELECT COUNT(DISTINCT user_id) AS activeToday
      FROM user_activity_logs
      WHERE DATE(created_at) = CURDATE()
    `);

    const [sms] = await query(`
      SELECT COUNT(*) AS totalSMS
      FROM sms_logs
    `);

    res.json({
      totalUsers: users.totalUsers,
      totalPolicies: policies.totalPolicies,
      activeToday: activeToday.activeToday,
      totalSMS: sms.totalSMS
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/user-activities", isAdmin, async (req, res) => {
  try {

    const rows = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_picture,

        (
          SELECT COUNT(*)
          FROM policies p
          WHERE p.created_by = u.id
        ) AS policies_added,

        (
          SELECT COUNT(*)
          FROM policy_history ph
          WHERE ph.created_by = u.id
        ) AS renewals,

        (
          SELECT COUNT(*)
          FROM followups f
          WHERE f.created_by = u.id
        ) AS followups,

        (
          SELECT COUNT(*)
          FROM sms_logs s
          WHERE s.created_by = u.id
        ) AS sms_sent,

        (
          SELECT MAX(created_at)
          FROM user_activity_logs ua
          WHERE ua.user_id = u.id
          AND ua.activity_type = 'LOGIN'
        ) AS last_login,

        (
          SELECT MAX(created_at)
          FROM user_activity_logs ua
          WHERE ua.user_id = u.id
          AND ua.activity_type = 'LOGOUT'
        ) AS last_logout

      FROM users u
      ORDER BY last_login DESC
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

//===================== START SERVER ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`🚀 Server running on port ${PORT} `));
