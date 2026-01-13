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
app.use(cors({
  origin: "https://insure-app-olive.vercel.app", // <-- must be a string
  credentials: true // required if using cookies/sessions
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ======================== DATABASE ========================

// ======================== DATABASE ========================
// ======================== DATABASE ========================
// ======================== DATABASE ========================
console.log("ENV:", process.env.NODE_ENV);
console.log("MYSQLHOST exists:", !!process.env.MYSQLHOST);
const isProduction = process.env.NODE_ENV === "production";

const db = mysql.createPool({
  host: isProduction ? process.env.MYSQLHOST : process.env.DB_HOST,
  user: isProduction ? process.env.MYSQLUSER : process.env.DB_USER,
  password: isProduction ? process.env.MYSQLPASSWORD : process.env.DB_PASS,
  database: isProduction ? process.env.MYSQLDATABASE : process.env.DB_NAME,
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
  secret: process.env.SESSION_SECRET || "supersecretkey",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    // Change this part to be more robust:
    secure: true, 
    sameSite: "none"
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

const logSMS = async (to, message, cost = 0, status = "pending", messageId = "N/A") => {
  try {
    // If API returns 0.00, we use a standard local rate (e.g., 15 RWF)
    const finalCost = (parseFloat(cost) === 0) ? 15.00 : parseFloat(cost);

    await query(
      "INSERT INTO sms_logs (phone_number, message, message_id, cost, delivery_status) VALUES (?, ?, ?, ?, ?)",
      [to, message, messageId, finalCost, status]
    );
  } catch (err) {
    console.error("SMS log error:", err.message);
  }
};

const sendSMS = async (to, message) => {
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
        r.messageId
      );
      
      return { success: r.status === "Success", result: r };
    }
    
    return { success: false, error: "No recipient data returned" };
  } catch (err) {
    console.error("SMS send error:", err);
    await logSMS(formatted, message, 0, "failed", "N/A");
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

// ======================== TABLES ========================
async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'User',
    status VARCHAR(20) DEFAULT 'Active',
    join_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
await query(`
  CREATE TABLE IF NOT EXISTS followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    policy_id INT NOT NULL,
    followup_status ENUM('confirmed','pending','missed') NOT NULL,
    notes TEXT,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_policy (policy_id),
    FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
  )
`);

  await query(`CREATE TABLE IF NOT EXISTS policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate VARCHAR(50),
    owner VARCHAR(255),
    company VARCHAR(255),
    start_date DATE,
    expiry_date DATE,
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS password_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100),
    otp VARCHAR(6),
    expires_at BIGINT
  )`);

  await query(`CREATE TABLE IF NOT EXISTS sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50),
    message TEXT,
    message_id VARCHAR(255),
    cost DECIMAL(10,2) DEFAULT 0,
    delivery_status VARCHAR(100) DEFAULT 'pending',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await query(`
  CREATE TABLE IF NOT EXISTS policy_history (
    id INT(11) NOT NULL AUTO_INCREMENT,
    policy_id INT(11) NOT NULL,
    expiry_date DATE NOT NULL,
    renewed_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY policy_id (policy_id)
  ) ENGINE=InnoDB
`);

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
    req.session.userRole = user.role;

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
app.post("/auth/logout", isAuthenticated, (req,res)=>{ req.session.destroy(err=>{ if(err) return res.status(500).json({error:"Logout failed"}); res.clearCookie("insureapp_session"); res.json({message:"Logged out"}); }); });

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

    res.json(user[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// ======================== USERS CRUD ========================
// ---------------- GET ALL USERS ----------------
app.get("/users", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, 
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
      ORDER BY id DESC
    `;
    
    const users = await query(sql);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------------- GET USER BY ID ----------------
app.get("/users/:id", async (req, res) => {
  try {
    const users = await query(
      `SELECT id, profile_picture, name, email, phone, role, status,
      DATE_FORMAT(join_date,'%Y-%m-%d') as joined_date,
      DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as created_at,
      DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%s') as updated_at
      FROM users WHERE id=?`,
      [req.params.id]
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
      "INSERT INTO users (name, email, phone, password, role, profile_picture) VALUES (?,?,?,?,?,?)",
      [name, email, phone, hashed, finalRole, profile_picture]
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
app.get("/policies", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, 
        plate, 
        owner, 
        company, 
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
        DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date, 
        contact,
        CASE 
          /* 1. Show 'Renewed' ONLY if updated in last 12h AND it's not a brand new record */
          WHEN updated_at > NOW() - INTERVAL 12 HOUR 
               AND updated_at > created_at + INTERVAL 1 MINUTE 
               THEN 'Renewed'
          
          /* 2. Standard date-based logic */
          WHEN DATEDIFF(expiry_date, NOW()) < 0 THEN 'Expired'
          WHEN DATEDIFF(expiry_date, NOW()) <= 3 THEN 'Expiring Soon'
          ELSE 'Active'
        END AS status
      FROM policies 
      ORDER BY expiry_date ASC
    `;

    const policies = await query(sql);
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/policies/:id", async (req, res) => {
  const rows = await query(`
    SELECT *,
      CASE
        WHEN DATEDIFF(expiry_date, NOW()) < 0 THEN 'Expired'
        WHEN DATEDIFF(expiry_date, NOW()) <= 3 THEN 'Expiring Soon'
        ELSE 'Active'
      END AS status
    FROM policies
    WHERE id = ?
  `, [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ error: "Policy not found" });
  }

  res.json(rows[0]);
});

// POST: Create a new policy
app.post("/policies",async (req, res) => {
  try {
    const { plate, owner, company, start_date, expiry_date, contact } = req.body;

    if (!plate || !owner || !company || !start_date || !expiry_date || !contact) {
      return res.status(400).json({ error: "All fields required" });
    }

    // 1. Check if the contact number already exists in policies
    const existing = await query("SELECT id FROM policies WHERE contact = ?", [contact]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Phone number is already associated with an active policy." });
    }

    // 2. Insert new policy
    const result = await query(
      "INSERT INTO policies (plate, owner, company, start_date, expiry_date, contact) VALUES (?,?,?,?,?,?)",
      [plate, owner, company, start_date, expiry_date, contact]
    );

    sendSMS(contact, `Your insurance policy for ${plate} runs from ${start_date} to ${expiry_date}.`)
      .catch(console.error);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Renew policy and log history
app.put("/policies/:id", isAdmin,async (req, res) => {
  try {
    const { plate, owner, company, start_date, expiry_date, contact } = req.body;
    const policyId = req.params.id;

    // 1. Check if the contact is already used by ANOTHER policy
    // We search for the contact where the ID is NOT the one we are currently updating
    const existingContact = await query(
      "SELECT id FROM policies WHERE contact = ? AND id != ?", 
      [contact, policyId]
    );

    if (existingContact.length > 0) {
      return res.status(400).json({ 
        error: "This contact number is already assigned to another policy." 
      });
    }

    // 2. Log current state into policy_history BEFORE updating
    const currentPolicy = await query("SELECT expiry_date FROM policies WHERE id = ?", [policyId]);
    
    if (currentPolicy.length > 0) {
      await query(
        "INSERT INTO policy_history (policy_id, expiry_date, renewed_date) VALUES (?, ?, ?)",
        [policyId, currentPolicy[0].expiry_date, new Date()]
      );
    }

    // 3. Update the main policy table
    await query(
      `UPDATE policies 
       SET plate=?, owner=?, company=?, start_date=?, expiry_date=?, contact=?, updated_at=NOW() 
       WHERE id=?`,
      [plate, owner, company, start_date, expiry_date, contact, policyId]
    );

    sendSMS(contact, `Your insurance policy for ${plate} has been renewed. New period: ${start_date} to ${expiry_date}.`)
      .catch(console.error);

    res.json({ message: "Policy renewed successfully", status: "Renewed" });
  } catch (err) {
    // Catch unique constraint violation if manual check fails or race condition occurs
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Contact number already exists in the system." });
    }
    res.status(500).json({ error: err.message });
  }
});
app.delete("/policies/:id", isAdmin,async (req,res)=>{ await query("DELETE FROM policies WHERE id=?",[req.params.id]); res.json({ message:"Policy deleted" }); });

// ======================== DASHBOARD / STATS ========================
app.get("/api/summary", async (req,res)=>{ const stats = await query("SELECT COUNT(*) AS created,SUM(CASE WHEN DATEDIFF(expiry_date,NOW())>3 THEN 1 ELSE 0 END) AS active,SUM(CASE WHEN DATEDIFF(expiry_date,NOW())<=3 AND DATEDIFF(expiry_date,NOW())>=0 THEN 1 ELSE 0 END) AS expiring,SUM(CASE WHEN DATEDIFF(expiry_date,NOW())<0 THEN 1 ELSE 0 END) AS expired FROM policies"); res.json(stats[0]); });
app.get("/api/trends", async (req, res) => {
  const results = await query(`
    SELECT 
      DATE_FORMAT(expiry_date, '%b %Y') AS month,
      SUM(CASE WHEN DATEDIFF(expiry_date, NOW()) > 0 THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN DATEDIFF(expiry_date, NOW()) <= 0 THEN 1 ELSE 0 END) AS expired,
      -- If you don't have a 'renewed' column, we can use 0 or a placeholder
      COUNT(*) AS total 
    FROM policies 
    GROUP BY month 
    ORDER BY MIN(expiry_date) DESC 
    LIMIT 12
  `);
  res.json({ trends: results });
});
app.get("/api/company-distribution", async (req,res)=>{ const results = await query("SELECT company AS name, COUNT(*) AS value FROM policies GROUP BY company"); const colors = ["hsl(var(--primary))","hsl(var(--success))","hsl(var(--warning))","hsl(var(--destructive))"]; const data = results.map((r,i)=>({...r,color:colors[i%colors.length]})); res.json(data); });
app.get("/api/sidebar-counts", async (req,res)=>{ const results = await query("SELECT (SELECT COUNT(*) FROM policies) AS policies,(SELECT COUNT(*) FROM users) AS users"); res.json(results[0]||{ policies:0, users:0 }); });

// ======================== EMAIL OTP / RESET ========================
app.post("/auth/send-otp", async (req,res)=>{ const { email } = req.body; if(!email) return res.status(400).json({ error:"Email required" }); const users = await query("SELECT id FROM users WHERE email=?",[email]); if(!users.length) return res.status(404).json({ error:"Email not registered" }); const otp = crypto.randomInt(100000,999999).toString(); const expires = Date.now() + 5*60*1000; await query("DELETE FROM password_otps WHERE email=?",[email]); await query("INSERT INTO password_otps (email,otp,expires_at) VALUES (?,?,?)",[email,otp,expires]); await transporter.sendMail({from:`"InsureApp Support" <${process.env.SMTP_USER}>`,to:email,subject:"Password Reset OTP",html:`<h2>Password Reset</h2><p>Your OTP is:</p><h1>${otp}</h1><p>Expires in 5 minutes.</p>`}); res.json({ message:"OTP sent to email" }); });
app.post("/auth/verify-otp", async (req,res)=>{ const { email, otp } = req.body; if(!email||!otp) return res.status(400).json({ error:"Missing data" }); const rows = await query("SELECT * FROM password_otps WHERE email=? AND otp=?",[email,otp]); if(!rows.length) return res.status(400).json({ error:"Invalid OTP" }); if(rows[0].expires_at < Date.now()) return res.status(400).json({ error:"OTP expired" }); res.json({ message:"OTP verified" }); });
app.post("/auth/reset-password", async (req,res)=>{ const { email, password } = req.body; if(!email||!password) return res.status(400).json({ error:"Missing data" }); const hashed = await bcrypt.hash(password,10); await query("UPDATE users SET password=? WHERE email=?",[hashed,email]); await query("DELETE FROM password_otps WHERE email=?",[email]); res.json({ message:"Password updated successfully" }); });

// ======================== EXPIRY REPORT ========================
app.get("/api/expiry-report", async (req, res) => {
  const { company = "all" } = req.query;
  const filter = company !== "all" ? "AND p.company=?" : "";
  const params = company !== "all" ? [company] : [];

  // SQL Helper to avoid repeating the JOIN logic
  const baseSelect = `
    SELECT 
      p.id, p.plate, p.owner, p.company, p.contact,
      DATE_FORMAT(p.expiry_date, '%Y-%m-%d') AS expiryDate,
      f.followup_status 
    FROM policies p
    LEFT JOIN followups f ON p.id = f.policy_id
  `;

  const today = await query(`${baseSelect} WHERE p.expiry_date = CURDATE() ${filter} ORDER BY p.expiry_date ASC`, params);
  const week = await query(`${baseSelect} WHERE p.expiry_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) ${filter} ORDER BY p.expiry_date ASC`, params);
  const month = await query(`${baseSelect} WHERE p.expiry_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 8 DAY) AND LAST_DAY(CURDATE()) ${filter} ORDER BY p.expiry_date ASC`, params);
  const expired = await query(`
    SELECT 
      p.id, p.plate, p.owner, p.company, p.contact,
      DATE_FORMAT(p.expiry_date, '%Y-%m-%d') AS expiryDate,
      DATEDIFF(CURDATE(), p.expiry_date) AS days_overdue,
      f.followup_status
    FROM policies p
    LEFT JOIN followups f ON p.id = f.policy_id
    WHERE p.expiry_date < CURDATE() ${filter} 
    ORDER BY p.expiry_date DESC`, params);

  res.json({ today, week, month, expired });
});
// ======================== SMS LOGS ========================
app.get("/sms/logs", isAuthenticated, async (req,res)=>{ // Added 'cost' to the SELECT statement
const logs = await query("SELECT id, phone_number, message, cost, delivery_status, is_read, created_at FROM sms_logs ORDER BY created_at DESC LIMIT 20"); const unread = logs.filter(l=>l.is_read===0).length; res.json({ logs, unread }); });
app.put("/sms/mark-read", isAuthenticated, async (req,res)=>{ await query("UPDATE sms_logs SET is_read = 1 WHERE is_read = 0"); res.json({ message:"Notifications marked as read" }); });
app.put("/sms/mark-unread/:id", isAuthenticated, async (req,res)=>{ await query("UPDATE sms_logs SET is_read=0 WHERE id=?",[req.params.id]); res.json({ message:"Marked as unread" }); });
app.delete("/sms/delete/:id", isAuthenticated, async (req,res)=>{ await query("DELETE FROM sms_logs WHERE id=?",[req.params.id]); res.json({ message:"Deleted" }); });

cron.schedule("0 0 * * *", async () => {
  // ---------------- Expired policies ----------------
  const expired = await query(`
    SELECT id, plate, contact, expiry_date
    FROM policies
    WHERE DATEDIFF(expiry_date, CURDATE()) < 0
  `);

  for (const p of expired) {
    // Send expiry SMS
    sendSMS(p.contact, `Your policy for ${p.plate} expired on ${p.expiry_date}`)
      .catch(console.error);

    // Insert into policy_history if not already recorded
    await query(`
      INSERT INTO policy_history (policy_id, expiry_date)
      SELECT ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM policy_history
        WHERE policy_id = ? AND expiry_date = ?
      )
    `, [p.id, p.expiry_date, p.id, p.expiry_date]);
  }
});
//history 
app.put("/policies/:id", async (req, res) => {
  const { start_date, expiry_date, contact } = req.body;
  const policyId = req.params.id;

  // Update policy
  await query(`
    UPDATE policies
    SET start_date=?, expiry_date=?, contact=?, updated_at=NOW()
    WHERE id=?
  `, [start_date, expiry_date, contact, policyId]);

  // Update policy_history: set renewed_date for the last expiry
  await query(`
    UPDATE policy_history
    SET renewed_date=?
    WHERE policy_id=? AND renewed_date IS NULL
    ORDER BY expiry_date DESC
    LIMIT 1
  `, [start_date, policyId]);

  sendSMS(contact, `Your insurance policy has been renewed from ${start_date} to ${expiry_date}`)
    .catch(console.error);

  res.json({ message: "Policy renewed successfully" });
});
app.get("/api/policy-history", async (req, res) => {
  try {
    const rows = await query(`
      SELECT ph.id, ph.policy_id, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      ORDER BY ph.expiry_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ======================== POLICY HISTORY ROUTES ========================

// 1️⃣ Get all policy history (optional date filter)
app.get("/api/policy-history", async (req, res) => {
  const { start, end } = req.query;
  try {
    let sql = `
      SELECT ph.id, ph.policy_id, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
    `;
    const params = [];

    if (start && end) {
      sql += `
        WHERE (ph.expiry_date BETWEEN ? AND ?) 
           OR (ph.renewed_date BETWEEN ? AND ?)
      `;
      params.push(start, end, start, end);
    }

    sql += " ORDER BY ph.expiry_date DESC";

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Get history for a specific policy
app.get("/api/policy-history/:policyId", async (req, res) => {
  const { policyId } = req.params;
  try {
    const rows = await query(`
      SELECT ph.id, ph.policy_id, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      WHERE ph.policy_id = ?
      ORDER BY ph.expiry_date DESC
    `, [policyId]);

    res.json(rows);
  } catch (err) {
    console.error("Policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Get only expired policies (not yet renewed)
app.get("/api/policy-history/expired", async (req, res) => {
  try {
    const rows = await query(`
      SELECT ph.id, ph.policy_id, ph.expiry_date, ph.renewed_date, ph.created_at, ph.updated_at,
             p.plate, p.owner, p.company
      FROM policy_history ph
      JOIN policies p ON p.id = ph.policy_id
      WHERE ph.renewed_date IS NULL
      ORDER BY ph.expiry_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Expired policy history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ======================== FOLLOW UPS ========================

// CREATE or UPDATE follow-up
// ======================== FOLLOW-UPS ========================
app.post("/api/followup", async (req, res) => {
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

    await query(
      `
      INSERT INTO followups (policy_id, followup_status, notes)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        followup_status = VALUES(followup_status),
        notes = VALUES(notes),
        followed_at = CURRENT_TIMESTAMP
      `,
      [policy_id, followup_status, notes || null]
    );

    res.json({ message: "Follow-up saved successfully" });
  } catch (err) {
    console.error("Follow-up error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all follow-ups with policy details
app.get("/api/followup", async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        f.id,
        f.followup_status,
        f.followed_at,

        p.id AS policy_id,
        p.plate,
        p.owner,
        p.company,
        DATE_FORMAT(p.expiry_date, '%Y-%m-%d') AS expiryDate,
        p.contact
      FROM followups f
      JOIN policies p ON p.id = f.policy_id
      ORDER BY f.followed_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Fetch follow-ups error:", err);
    res.status(500).json({ error: err.message });
  }
});
//
// ---------------- CLEAR  status ----------------
app.delete("/api/followup/:policy_id", async (req, res) => {
  try {
    const { policy_id } = req.params;
    await query("DELETE FROM followups WHERE policy_id = ?", [policy_id]);
    res.json({ message: "Follow-up status cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const backfillPolicyHistory = async () => {
  try {
    const expired = await query(`
      SELECT id, plate, contact, expiry_date
      FROM policies
      WHERE expiry_date <= CURDATE()
    `);

    for (const p of expired) {
      await query(`
        INSERT INTO policy_history (policy_id, expiry_date)
        SELECT ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM policy_history
          WHERE policy_id = ? AND expiry_date = ?
        )
      `, [p.id, p.expiry_date, p.id, p.expiry_date]);
    }

    console.log("✅ Expired policies added to policy_history");
  } catch (err) {
    console.error(err);
  }
};

// Call the async function
backfillPolicyHistory();
//send message 
app.post("/api/policies/broadcast", async (req, res) => {
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
          .replace(/{plate}/g, client.plate || "your vehicle")
          .replace(/{days}/g, client.days || "0");

        // Use your existing sendSMS helper
        const result = await sendSMS(client.contact, personalizedMessage);
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
app.post("/policies/import", isAdmin, async (req, res) => {
  const { policies } = req.body;

  try {
    for (const p of policies) {
      await query(
        `INSERT INTO policies 
        (plate, owner, company, start_date, expiry_date, contact)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          p.plate,
          p.owner,
          p.company,
          p.start_date,
          p.expiry_date,
          p.contact,
        ]
      );
    }

    res.json({ success: true, count: policies.length });
  } catch (err) {
    res.status(500).json({ error: "Import failed" });
  }
});

//===================== START SERVER ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`🚀 Server running on port ${PORT} `));
