import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

dotenv.config();

const app = express();
const PORT = 3000;
const db = new Database("wedding.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`
);

// Helper to get tokens from DB
function getStoredTokens() {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get("google_tokens");
  return row ? JSON.parse(row.value as string) : null;
}

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file"
    ],
    prompt: "consent"
  });
  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
      "google_tokens",
      JSON.stringify(tokens)
    );
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f2ed;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a;">Connection Successful!</h1>
            <p>Your Google account is now linked to the wedding app.</p>
            <p>You can close this window now.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/auth/status", (req, res) => {
  const tokens = getStoredTokens();
  res.json({ connected: !!tokens });
});

// RSVP Route
app.post("/api/rsvp", async (req, res) => {
  const { name, attending, guests, message, diet } = req.body;
  const tokens = getStoredTokens();

  if (!tokens) {
    return res.status(400).json({ error: "Google Sheets not configured by admin." });
  }

  try {
    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // If no sheet ID, try to find or create one
    if (!spreadsheetId) {
       const storedSheetId = db.prepare("SELECT value FROM config WHERE key = ?").get("google_sheet_id");
       if (storedSheetId) {
         spreadsheetId = storedSheetId.value as string;
       } else {
         // Create a new sheet
         const resource = {
           properties: { title: "Wedding RSVPs - Maria & Andrei" },
         };
         const spreadsheet = await sheets.spreadsheets.create({
           requestBody: resource,
           fields: "spreadsheetId",
         });
         spreadsheetId = spreadsheet.data.spreadsheetId!;
         db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run("google_sheet_id", spreadsheetId);
         
         // Add headers
         await sheets.spreadsheets.values.append({
           spreadsheetId,
           range: "Sheet1!A1",
           valueInputOption: "RAW",
           requestBody: {
             values: [["Timestamp", "Name", "Attending", "Guest Count", "Dietary Requirements", "Message"]]
           }
         });
       }
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [[new Date().toLocaleString(), name, attending ? "Yes" : "No", guests, diet, message]]
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving to sheets:", error);
    res.status(500).json({ error: "Failed to save RSVP" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
