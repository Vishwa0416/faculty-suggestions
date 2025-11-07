// Replace this with your actual Spreadsheet ID
const SPREADSHEET_ID = "1AtuKO04BmJKBrvIOHSVs-ZAtbEf2ktH0QZ3EYbHqOcs";

/**
 * Handle GET requests - with all actions
 */
function doGet(e) {
  try {
    Logger.log("GET request received");
    Logger.log("Parameters: " + JSON.stringify(e.parameter));

    const action = e.parameter.action;
    Logger.log("Action: " + action);

    if (action === "getSuggestions") {
      return getSuggestions();
    }

    if (action === "getPublicResponses") {
      return getPublicResponses();
    }

    if (action === "searchByTrackingId") {
      const trackingId = e.parameter.trackingId;
      Logger.log("TrackingId parameter: " + trackingId);
      return searchByTrackingId(trackingId);
    }

    if (action === "searchByEmail") {
      const email = e.parameter.email;
      Logger.log("Email parameter: " + email);
      return searchByEmail(email);
    }

    Logger.log("No valid action found");
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Invalid action. Received: " + action,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Error: " + error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === "submitResponse") {
      return submitResponse(data);
    }

    // Handle new suggestion submission
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    // Get last row to check if headers exist
    const lastRow = sheet.getLastRow();

    // Add headers if sheet is empty
    if (lastRow === 0) {
      sheet.appendRow([
        "Timestamp",
        "Role",
        "Department",
        "Suggestion",
        "Email",
        "Status",
        "AdminResponse",
        "RespondedBy",
        "RespondedAt",
        "IsAnonymous",
        "TrackingId",
      ]);

      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4A90E2");
      headerRange.setFontColor("#FFFFFF");
    }

    Logger.log("Received suggestion data: " + JSON.stringify(data));

    const rowData = [
      new Date(data.timestamp),
      data.role || "",
      data.department || "",
      data.suggestion || "",
      data.senderEmail || "",
      "new",
      "", // AdminResponse
      "", // RespondedBy
      "", // RespondedAt
      data.isAnonymous ? "TRUE" : "FALSE",
      data.trackingId || "",
    ];

    Logger.log("Appending row: " + JSON.stringify(rowData));
    sheet.appendRow(rowData);

    sheet.autoResizeColumns(1, 11);

    Logger.log(
      "Suggestion saved successfully with TrackingId: " +
        (data.trackingId || "N/A")
    );

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Suggestion submitted successfully",
        trackingId: data.trackingId || null,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all suggestions (for admin panel)
 */
function getSuggestions() {
  try {
    Logger.log("getSuggestions called");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log("No data found in sheet");
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          suggestions: [],
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const suggestions = [];

    const headers = data[0];
    Logger.log("Headers: " + JSON.stringify(headers));

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row[0] || !row[3]) continue;

      suggestions.push({
        id: i,
        rowIndex: i + 1,
        timestamp: row[0],
        role: row[1],
        department: row[2],
        suggestion: row[3],
        senderEmail: row[4] || "",
        status: row[5] || "new",
        adminResponse: row[6] || "",
        respondedBy: row[7] || "",
        respondedAt: row[8] || "",
        isAnonymous: row[9] === "TRUE" || row[9] === true,
        trackingId: row[10] || "",
      });
    }

    Logger.log("Found " + suggestions.length + " suggestions");

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        suggestions: suggestions,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in getSuggestions: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
        suggestions: [],
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get public responses (only responded suggestions) - for PDF report
 */
function getPublicResponses() {
  try {
    Logger.log("=== getPublicResponses called ===");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log("No data in sheet");
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          responses: [],
          count: 0,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const responses = [];

    Logger.log("Total rows in sheet: " + data.length);
    Logger.log("Headers: " + JSON.stringify(data[0]));

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row[0]) continue;
      if (!row[3]) continue;

      const status = String(row[5] || "")
        .toLowerCase()
        .trim();
      const adminResponse = String(row[6] || "").trim();

      if (status === "responded" && adminResponse.length > 0) {
        const isAnonymous = row[9] === "TRUE" || row[9] === true;
        const trackingId = row[10] || "";

        responses.push({
          timestamp: row[0],
          role: row[1] || "N/A",
          department: row[2] || "N/A",
          suggestion: row[3],
          adminResponse: adminResponse,
          respondedBy: row[7] || "Admin",
          respondedAt: row[8] || new Date(),
          isAnonymous: isAnonymous,
          trackingId: isAnonymous ? trackingId : null,
        });
      }
    }

    Logger.log("=== Total responses found: " + responses.length + " ===");

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        responses: responses,
        count: responses.length,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("!!! Error in getPublicResponses: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
        responses: [],
        count: 0,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Search by Tracking ID
 */
function searchByTrackingId(trackingId) {
  try {
    Logger.log("=== searchByTrackingId called ===");
    Logger.log("Searching for tracking ID: " + trackingId);

    if (!trackingId) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: "Tracking ID is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          results: [],
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const results = [];

    const searchTrackingId = String(trackingId).toUpperCase().trim();
    Logger.log("Normalized search ID: " + searchTrackingId);

    // Search for tracking ID (column K, index 10)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row[0] || !row[3]) continue;

      const rowTrackingId = String(row[10] || "")
        .toUpperCase()
        .trim();

      Logger.log("Row " + (i + 1) + " TrackingId: " + rowTrackingId);

      if (rowTrackingId === searchTrackingId) {
        Logger.log("✓ Found match at row " + (i + 1));

        results.push({
          timestamp: row[0],
          role: row[1],
          department: row[2],
          suggestion: row[3],
          senderEmail: "HIDDEN", // Don't expose email for anonymous
          status: row[5] || "new",
          adminResponse: row[6] || "",
          respondedBy: row[7] || "",
          respondedAt: row[8] || "",
          isAnonymous: true,
          trackingId: row[10],
        });
      }
    }

    Logger.log("Search completed. Found " + results.length + " results");

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        results: results,
        count: results.length,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("!!! Error in searchByTrackingId: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
        results: [],
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Search by Email
 */
function searchByEmail(email) {
  try {
    Logger.log("=== searchByEmail called ===");
    Logger.log("Searching for email: " + email);

    if (!email) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: "Email is required",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          results: [],
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const results = [];

    const searchEmail = String(email).toLowerCase().trim();
    Logger.log("Normalized search email: " + searchEmail);

    // Search for email (column E, index 4)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (!row[0] || !row[3]) continue;

      const rowEmail = String(row[4] || "")
        .toLowerCase()
        .trim();

      Logger.log("Row " + (i + 1) + " Email: " + rowEmail);

      // Skip anonymous submissions and empty emails
      if (!rowEmail || rowEmail === "anonymous") {
        Logger.log("  → Skipping (anonymous or empty)");
        continue;
      }

      if (rowEmail === searchEmail) {
        Logger.log("✓ Found match at row " + (i + 1));

        results.push({
          timestamp: row[0],
          role: row[1],
          department: row[2],
          suggestion: row[3],
          senderEmail: row[4],
          status: row[5] || "new",
          adminResponse: row[6] || "",
          respondedBy: row[7] || "",
          respondedAt: row[8] || "",
          isAnonymous: row[9] === "TRUE",
          trackingId: row[10] || "",
        });
      }
    }

    Logger.log("Search completed. Found " + results.length + " results");

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        results: results,
        count: results.length,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("!!! Error in searchByEmail: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
        results: [],
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Submit admin response
 */
function submitResponse(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet();

    const rowIndex = data.rowIndex;

    sheet.getRange(rowIndex, 6).setValue("responded");
    sheet.getRange(rowIndex, 7).setValue(data.response);
    sheet.getRange(rowIndex, 8).setValue(data.respondedBy);
    sheet.getRange(rowIndex, 9).setValue(new Date(data.respondedAt));

    const rowRange = sheet.getRange(rowIndex, 1, 1, 11);
    rowRange.setBackground("#D1FAE5");

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Response submitted successfully",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in submitResponse: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function
 */
function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log("Spreadsheet Name: " + ss.getName());
  Logger.log("Active Sheet: " + ss.getActiveSheet().getName());
  Logger.log("Last Row: " + ss.getActiveSheet().getLastRow());
  Logger.log("Setup successful!");
}

/**
 * Test getting public responses
 */
function testPublicResponses() {
  Logger.log("Testing getPublicResponses...");
  const result = getPublicResponses();
  Logger.log("Result: " + result.getContent());
}

/**
 * Test search by tracking ID
 */
function testSearchByTrackingId() {
  Logger.log("Testing searchByTrackingId...");
  // Replace with a real tracking ID from your sheet
  const result = searchByTrackingId("LU1WVZO-B6HU");
  Logger.log("Result: " + result.getContent());
}

/**
 * Test search by email
 */
function testSearchByEmail() {
  Logger.log("Testing searchByEmail...");
  // Replace with a real email from your sheet
  const result = searchByEmail("test@example.com");
  Logger.log("Result: " + result.getContent());
}
