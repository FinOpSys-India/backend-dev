const snowflake = require("snowflake-sdk");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const saltRoundMember = 10;

const connection = snowflake.createConnection({
  account: "hewvhtb-rh34135",
  username: "database",
  password: "Pratibha@1",
  warehouse: "FINOPSYS_WH",
  database: "FINOPSYS_DB",
  schema: "PUBLIC",
  role: "ACCOUNTADMIN",
});

connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake.");
  }
});

// --------------------------------------quick book-------------------------------------------------
const OAuthClient = require("intuit-oauth");
require("dotenv").config();

const oauthClient = new OAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: process.env.REDIRECT_URL,
});

const initiateAuth = (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: "5banyuniquestringb",
  });
  res.json({ url: authUri });
};

const handleCallback = async (req, res) => {
  const parseRedirect = req.url;

  try {
    const authResponse = await oauthClient.createToken(parseRedirect);
    // res.redirect('http://localhost:3000/');
  } catch (e) {
    console.error("Error during OAuth callback:", e);
    // res.redirect('http://localhost:3000/error');
  }
};

const updateQuickbookActiveness = (userData, callback) => {
  const sql = `
      UPDATE signUp_userData SET quickbookActiveness = ? WHERE firstName = ?`;

  const data = userData;

  const values = [
    Boolean(data.quickbookActiveness), // Ensure quickbookActiveness is a boolean
    data.firstName, // Use firstName to identify the record
  ];

  // Execute the SQL statement
  connection.execute({
    sqlText: sql,
    binds: values,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error executing SQL statement:", err);
        return callback("Error updating quickbookActiveness in server");
      }
      callback(null, "Update successful");
    },
  });
};

function getquickbookIntegration(firstName, callback) {
  const sql =
    "SELECT quickbookActiveness FROM signUp_userData WHERE firstName = ?";

  connection.execute({
    sqlText: sql,
    binds: [firstName],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(err, null);
      }
      if (rows.length === 0) {
        return callback(
          new Error("No data found for the specified name"),
          null
        );
      }

      const quickbookActiveness = rows[0].QUICKBOOKACTIVENESS;
      callback(null, { quickbookActiveness });
    },
  });
}

// -----------------------------------------userName insert---------------------------

function createUser(userData, callback) {
  const getMaxIdSql = "SELECT MAX(id) AS maxId FROM signUp_userData";
  connection.execute({
    sqlText: getMaxIdSql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error fetching max ID:", err);
        return callback("Error in generating ID");
      }

      let nextId;
      if (rows && rows[0] && rows[0].maxId) {
        const currentMaxId = rows[0].maxId;
        const idNumber = parseInt(currentMaxId.split("-")[1]) + 1;
        nextId = `Fin-${idNumber}`;
      } else {
        nextId = "Fin-1";
      }

      const sql =
        "INSERT INTO signUp_userData (id, firstName, lastName, workEmail, companyName, companyType, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

      bcrypt.hash(userData.password.toString(), saltRounds, (err, hash) => {
        if (err) {
          return callback("Error in hashing password");
        }

        const values = [
            nextId,
          userData.firstName,
          userData.lastName,
          userData.workEmail,
          userData.companyName,
          userData.companyType,
          userData.phoneNumber,
          hash,
        ];

        connection.execute({
          sqlText: sql,
          binds: values,
          complete: (err, stmt, rows) => {
            if (err) {
              console.error("Error executing SQL:", err);
              return callback("Inserting data error in server");
            }

            // Check if rows is defined and handle accordingly
            if (rows !== undefined) {
              // Perform operations with rows if needed
              callback(null, "Successful");
            } else {
              callback("No rows returned from the query");
            }
          },
        });
      });
    },
  });
}

function findUserByEmail(email, callback) {
  const sql = "SELECT * FROM signUp_userData WHERE workEmail = ?";
  connection.execute({
    sqlText: sql,
    binds: [email],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Login error in the server");
      }
      callback(null, rows);
    },
  });
}

function findUserByPhone(phoneNumber, callback) {
  const sql = "SELECT * FROM signUp_userData WHERE phoneNumber = ?";
  connection.execute({
    sqlText: sql,
    binds: [phoneNumber],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Login error in the server");
      }
      callback(null, rows);
    },
  });
}

function updatePasswordInDatabase(workEmail, newPassword, callback) {
  // Hash the new password with bcrypt
  bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }
    // Assuming you have a function or SQL query to update the password
    const sql = `UPDATE signUp_userData SET password = ? WHERE workEmail = ?`;

    // Example using connection.execute to execute the query
    connection.execute({
      sqlText: sql,
      binds: [hashedPassword, workEmail],
      complete: (err, stmt, rows) => {
        if (err) {
          return callback(err.message || "Error updating password");
        }

        // Handle success
        callback(null, "Password updated successfully");
      },
    });
  });
}

function getLoginPersonDetails(email, callback) {
  const sql = "SELECT * FROM signUp_userData WHERE WORKEMAIL = ?";

  connection.execute({
    sqlText: sql,
    binds: [email],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Server error during login");
      }
      callback(null, rows);
    },
  });
}

// --------------------access control boolean ----------------------

function createAcessControl(userData, callback) {
  // const sql = "INSERT INTO booleanData (generalAccess, notification, page1) VALUES (?, ?, ?)";

  const sql =
    " UPDATE booleanData SET generalAccess = ?, notification = ?, page1 = ? ";

  const values = [
    Boolean(userData.generalAccess),
    Boolean(userData.notification),
    Boolean(userData.page1),
  ];

  connection.execute({
    sqlText: sql,
    binds: values,
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Inserting data error in server");
      }
      callback(null, "Successful");
    },
  });
}

function getAccessControl(req, callback) {
  const name = req.query.name || "pratibha";
  const sql = "SELECT * FROM booleanData WHERE name = ?";

  connection.execute({
    sqlText: sql,
    binds: [name],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(err, null);
      }
      if (rows.length === 0) {
        return callback(
          new Error("No data found for the specified name"),
          null
        );
      }
      const accessControl = rows[0]; // Assuming rows[0] contains the data

      callback(null, accessControl);
    },
  });
}

// ---------------------------------------------------Memeber sections--------------------------------------------------------------

function createMemberOfCompany(userData, callback) {
  const sql =
    "INSERT INTO signUp_MemberData (firstName, lastName, workEmail, companyName, memberPosition, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?)";

  bcrypt.hash(userData.password.toString(), saltRoundMember, (err, hash) => {
    if (err) {
      return callback("Error in hashing password");
    }

    const values = [
      userData.firstName,
      userData.lastName,
      userData.workEmail,
      userData.companyName,
      userData.memberPosition,
      userData.phoneNumber,
      hash,
    ];

    connection.execute({
      sqlText: sql,
      binds: [values],
      complete: (err, stmt, rows) => {
        if (err) {
          console.log(err);
          return callback("Inserting data error in server");
        }
        callback(null, "Successful");
      },
    });
  });
}

//   ---------------------------- fetch all company details----------------------------------------------
const fetchAllCompanyMembers = (callback) => {
  const sql = ` SELECT  firstName,
            lastName,
            workEmail,
            companyName,
            memberPosition,
            phoneNumber, FROM signUp_MemberData;  `;

  connection.execute({
    sqlText: sql,
    complete: (err, stmt, rows) => {
      callback(err, rows);
    },
  });
};

function findCompanyMemberByEmail(email, callback) {
  const sql = "SELECT * FROM signUp_MemberData WHERE workEmail = ?";

  const emailStr = email.toString();

  connection.execute({
    sqlText: sql,
    binds: [emailStr],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Login error in the server");
      }
      callback(null, rows);
    },
  });
}

function findCompanyMemberByPhone(phoneNumber, callback) {
  const sql = "SELECT * FROM signUp_MemberData WHERE phoneNumber = ?";
  connection.execute({
    sqlText: sql,
    binds: [phoneNumber],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Login error in the server");
      }
      callback(null, rows);
    },
  });
}

function updateMemberPasswordInDatabase(workEmail, newPassword, callback) {
  // Hash the new password with bcrypt
  bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }
    // Assuming you have a function or SQL query to update the password
    const sql = `UPDATE signUp_MemberData SET password = ? WHERE workEmail = ?`;

    // Example using connection.execute to execute the query
    connection.execute({
      sqlText: sql,
      binds: [hashedPassword, workEmail],
      complete: (err, stmt, rows) => {
        if (err) {
          return callback(err.message || "Error updating password");
        }

        // Handle success
        callback(null, "Password updated successfully");
      },
    });
  });
}

// ------------------------------------------------------------------------------Company details ( inserting )----------------------------------------------------

const insertCompanyDetails = (
  companyLogo,
  companyName,
  legalName,
  eid,
  phoneNumber,
  email,
  industryType,
  taxForm,
  createdBy,
  callback
) => {
  const sql = `
      INSERT INTO companyDetails (companyLogo, companyName, legalName, eid, phoneNumber, email, industryType, taxForm, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

  const binds = [
    companyLogo,
    companyName,
    legalName,
    eid,
    phoneNumber,
    email,
    industryType,
    taxForm,
    createdBy,
  ];

  connection.execute({
    sqlText: sql,
    binds: binds,
    complete: (err, stmt, rows) => {
      callback(err, rows);
    },
  });
};

//   ---------------------------- fetch all company details----------------------------------------------
const fetchAllCompanies = (createdBy, callback) => {
  const sql = ` SELECT *
      FROM companyDetails where createdBy = ? ;
    `;

  connection.execute({
    sqlText: sql,
    binds: [createdBy],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(null, rows);
      }
      callback(err, rows);
    },
  });
};

// ------------------------------------------------- fetch company details by EID -----------------------------------------------
const fetchCompanyByEid = (eid, callback) => {
  const sql = "SELECT * FROM companyDetails WHERE eid = ?";

  connection.execute({
    sqlText: sql,
    binds: [eid],
    complete: (err, stmt, rows) => {
      callback(err, rows);
    },
  });
};

//   -----------searchCompanyByEmail-------------------------------

const searchCompanyByEmail = (email, callback) => {
  const sql = "SELECT * FROM companyDetails WHERE email = ?";

  connection.execute({
    sqlText: sql,
    binds: [email],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(err, null);
      }
      if (rows.length === 0) {
        return callback(
          new Error("No data found for the specified email"),
          null
        );
      }
      const updateCompany = rows[0]; // Assuming rows[0] contains the data
      callback(null, updateCompany);
    },
  });
};

//---------- function to update company details by email--------------
function updateCompanyByEid(
  companyLogo,
  companyName,
  legalName,
  phoneNumber,
  eid,
  email,
  industryType,
  taxForm,
  createdBy,
  email,
  callback
) {
  let sql = `
    UPDATE companyDetails SET companyName = '${companyName}', legalName = '${legalName}', phoneNumber = '${phoneNumber}', industryType = '${industryType}', taxForm = '${taxForm} , createdBy='${createdBy}' WHERE eid = '${eid}';
    `;
  let binds = [
    companyName,
    legalName,
    phoneNumber,
    eid,
    industryType,
    taxForm,
    createdBy,
    email,
  ];
  if (companyLogo != null) {
    sql = `
    UPDATE companyDetails SET companyLogo = '${companyLogo}', companyName = '${companyName}', legalName = '${legalName}', phoneNumber = '${phoneNumber}', industryType = '${industryType}', taxForm = '${taxForm}', createdBy='${createdBy}' WHERE eid = '${eid}';
    `;
    binds = [
      companyLogo,
      companyName,
      legalName,
      phoneNumber,
      eid,
      industryType,
      taxForm,
      createdBy,
      email,
    ];
  }

  // Prepare values to bind

  connection.execute({
    sqlText: sql,
    binds: binds,
    complete: (err, stmt, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, result);
    },
  });
}

// ---------------------------- fetch all invoice details----------------------------------------------

const insertInvoice = (fileName, fileData, parsedData, callback) => {
  const query = `INSERT INTO Invoice (CASE_ID, BILL_ID, BILL_DATA) VALUES (?, ?,?)`;

  connection.execute({
    sqlText: query,
    binds: [fileName, fileName, fileData],
    complete: (err, stmt, rows) => {
      callback(err, rows);
    },
  });
};

const fetchAllInvoices = (callback) => {
  const sql = `
    SELECT 
      i.*, 
      v.vendor_name 
    FROM 
      Invoice AS i
    JOIN 
      VendorTable AS v ON i.vendor_id = v.vendor_id
    WHERE 
      i.status = 'Pending'; 
  `;

  connection.execute({
    sqlText: sql,
    binds: [], // No bind variables needed for this query
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, rows);
    },
  });
};

const fetchAllDeclineInvoices = (callback) => {
  const sql = `
    SELECT 
      i.*, 
      v.vendor_name 
    FROM 
      Invoice AS i
    JOIN 
      VendorTable AS v ON i.vendor_id = v.vendor_id
    WHERE 
      i.status = 'Decline the invoice'; 
  `;

  connection.execute({
    sqlText: sql,
    binds: [], // No bind variables needed for this query
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, rows);
    },
  });
};

// Function to update invoice status only if the current status is 'pending'
const updateInvoiceStatusIfPending = (invoiceId, newStatus, callback) => {
  const checkQuery = `
        SELECT status 
        FROM Invoice 
        WHERE case_id = ?`;
  const updateQuery = `
        UPDATE Invoice 
        SET status = ? 
        WHERE case_id = ?`;

  // Execute the check query first to determine the current status
  connection.execute({
    sqlText: checkQuery,
    binds: [invoiceId], // Bind the invoiceId to the check query
    complete: (err, stmt, rows) => {
      console.log("Step 2: Inside connection.execute callback for checkQuery");

      if (err) {
        console.log("Error executing check query:", err); // Log any errors from the check query
        return callback(err, null);
      }

      // Check if we have results and the status is 'pending'
      if (rows && rows.length > 0 && rows[0].STATUS === "Pending") {
        console.log("Step 3: Current status is pending, proceeding to update.");

        // Now update the status since it's pending
        connection.execute({
          sqlText: updateQuery,
          binds: [newStatus, invoiceId], // Bind the newStatus and invoiceId to the update query
          complete: (updateError, updateStmt, updateResults) => {
            console.log(
              "Step 4: Inside connection.execute callback for updateQuery"
            );

            if (updateError) {
              console.log("Error updating invoice status model:", updateError); // Log the error for debugging
              return callback(updateError, null);
            }

            console.log(
              "Step 5: Invoice status updated successfully:",
              updateResults
            ); // Log success message
            return callback(null, updateResults);
          },
        });
      } else {
        console.log("Step 3: Invoice status is not pending or does not exist.");
        return callback({ message: "Status is already approved/ declined !" });
      }
    },
  });
};

module.exports = {
  connection,

  createUser,
  findUserByEmail,
  findUserByPhone,
  updatePasswordInDatabase,
  getLoginPersonDetails,

  createAcessControl,
  getAccessControl,

  createMemberOfCompany,
  fetchAllCompanyMembers,
  findCompanyMemberByEmail,
  findCompanyMemberByPhone,
  updateMemberPasswordInDatabase,

  insertCompanyDetails,
  fetchAllCompanies,
  fetchCompanyByEid,
  searchCompanyByEmail,
  updateCompanyByEid,

  initiateAuth,
  handleCallback,
  updateQuickbookActiveness,
  getquickbookIntegration,

  insertInvoice,
  fetchAllInvoices,
  updateInvoiceStatusIfPending,
  fetchAllDeclineInvoices,
};
