const snowflake = require("snowflake-sdk");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const saltRoundMember = 10;

const connection = snowflake.createConnection({
  account: "hewvhtb-rh34135",
  username: "paras898",
  password: "Prs@89826",
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
  const getMaxIdSql = "SELECT COUNT(id) AS maxId FROM signUp_userData";
  connection.execute({
    sqlText: getMaxIdSql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error fetching max ID:", err);
        return callback("Error in generating ID"); 
      }
      console.log(userData)
      let nextId;
      const currentMaxId = rows[0]?.MAXID || 0;
      const idNumber = currentMaxId + 1;
      nextId = `Fin-${idNumber}`;
      let sql =
        "INSERT INTO signUp_userData (id, firstName, lastName, workEmail, companyName, companyType, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      if(userData?.department){
        sql =
        "INSERT INTO signUp_userData (id, firstName, lastName, workEmail, password,department) VALUES (?, ?, ?, ?, ?, ?)";
      }
      bcrypt.hash(userData.password.toString(), saltRounds, (err, hash) => {
        if (err) {
          return callback("Error in hashing password");
        }

        let values = [
            nextId,
          userData.firstName,
          userData.lastName,
          userData.workEmail,
          userData.companyName,
          userData.companyType, 
          userData.phoneNumber,
          hash,
        ];
        if(userData?.department){
           values = [
            nextId,
          userData.firstName,
          userData.lastName,
          userData.workEmail,
          hash,
          userData.department
        ];
        }

        console.log(values)
        console.log(sql)
        connection.execute({
          sqlText: sql,
          binds: values,
          complete: (err, stmt, rows) => {
            if (err) {
              console.error("Error executing SQL:", err);
              return callback("Inserting data error in server");
            }
            let roleId;
            switch (userData.role) {
              case "Admin":
                roleId = '1';
                break;
              case "ApPerson":
                roleId = '2';
                break;
              case "Approver1":
                roleId = '3';
                break;
              case "Approver2":
                roleId = '4';
                break;
              case "DepartMentHead":
                roleId = '5';
                break;
              default:  
                roleId = '1'; 
            }
            console.log(roleId)
            const insertUserRoleSql =
              "INSERT INTO user_role (COMPANY_ID, USERID, ROLEID ) VALUES (?, ?, ?)";
            const roleValues = ['1', nextId,  roleId];
            connection.execute({
              sqlText: insertUserRoleSql,
              binds: roleValues,
              complete: (err, stmt, rows) => {
                if (err) {
                  console.error("Error inserting into user_role:", err);
                  return callback("Error inserting role data");
                }
                // Final success callback
                // callback(null, "User and role successfully created");
              },
            });
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
function findRole(id, callback){
  console.log(id);
  const sql = "Select * from USER_ROLE where USERID = ?"
  connection.execute({
    sqlText:sql,
    binds:[id],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback("Login error in the server");
      }
      let roleValue;
      switch (rows[0].ROLEID) {
        case '1':
          roleValue = 'Admin';
          break;
        case '2':
          roleValue = 'ApPerson';
          break;
        case '3':
          roleValue = 'Approver1';
          break;
        case '4':
          roleValue = 'Approver2';
          break;
        case '5':
          roleValue = 'DepartMentHead';
          break;
        default:
          roleValue = 'Admin'; // Default role ID if none is specified
      }
      callback(null, roleValue);
    },
    
  })
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

  console.log("creat", createdBy)

  connection.execute({
    sqlText: sql,
    binds: binds,
    complete: (err, stmt, rows) => {
      console.log("createdBy", err)
      callback(err, rows);
    },
  });
};

//   ---------------------------- fetch all company details----------------------------------------------
const fetchAllCompanies = (createdBy, callback) => {
  const sql = ` SELECT *
      FROM companyDetails where createdBy = ? ;
    `;

    // console.log("createdBy", createdBy)
  connection.execute({
    sqlText: sql,
    binds: [createdBy],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(null, rows);
      }
      // console.log("createdBy", err)
      callback(err, rows);
    },
  });
};
const fetchAllVendors = (callback)=>{
  const sql = `SELECT * FROM vendortable`;
  connection.execute({
    sqlText: sql,
    binds: [],
    complete: (err, stmt, rows) => {
      if (err) {
        return callback(null, rows);
      }
      // console.log("createdBy", err)
      callback(err, rows);
    },
  });
}

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

const insertInvoice = (vendorId, amount,invoiceNo, recievingDate, dueDate, dept, glCode,fileName, fileData, callback) => {
  const getMaxIdSql = "SELECT COUNT(CASE_ID) AS maxId FROM invoice";
  connection.execute({
    sqlText: getMaxIdSql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error fetching max ID:", err);
        return callback("Error in generating ID"); 
      }

      let nextId;
      const currentMaxId = rows[0]?.MAXID || 1; // Default to C000 if no rows found
      nextId = `C${currentMaxId.toString()}`;
  const query = `INSERT INTO Invoice (CASE_ID, BILL_ID, VENDOR_ID, AMOUNT, DEPARTMENT, RECEIVING_DATE, DUE_DATE, GL_CODE, BILL_NAME, BILL_DATA, CUSTOMER_ID, STATUS, INBOX_METHOD, DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CU001', 'Pending', 'Manual', CURRENT_DATE)`;
  const values = [
    nextId,
    invoiceNo,
    vendorId,
    amount,
    dept,
    recievingDate,
    dueDate,
    glCode,
    fileName,
    fileData
  ]
  connection.execute({
    sqlText: query,
    binds: values,
    complete: (err, stmt, rows) => {
      callback(err, rows);
    },
  });
}})
};

const fetchAllInvoices = (role,currentPage,callback) => {
  let multipleStatus = false;
  let showAllStatus=false;
  let allStatus=[];
  let statuses = [];
  let status;
  if(role=="Admin"){
    if(currentPage=="approved"){
      status = 'AcceptedByAP'
    }else if(currentPage=="decline"){
      status = 'Decline'
    }
    else if(currentPage=="pendinginAp"){
      status="Pending"
    }
    else if(currentPage=='all'){
      showAllStatus=true;
      allStatus=["AcceptedByAP", "AcceptedByApprover1","AcceptedByApprover2","DeclineByApprover1", "DeclineByApprover2"]
    }
  }else if(role=="ApPerson"){
    if(currentPage=="approved"){
      status = 'AcceptedByApprover2'
    }else if(currentPage=="declineInAp"){
      status = 'Decline'
    }
    else if(currentPage=="declineInBills"){
      multipleStatus=true;
      statuses = ["DeclineByApprover1", "DeclineByApprover2"]; 
    }
    else if(currentPage=="pendingInAp"){
      status="Pending"      
    }else if(currentPage=="pendingInBills"){
      multipleStatus=true;
      statuses = ["AcceptedByAP", "AcceptedByApprover1"];
    }
    else if(currentPage=='all'){
      showAllStatus=true;
      allStatus=["AcceptedByAP", "AcceptedByApprover1","AcceptedByApprover2","DeclineByApprover1", "DeclineByApprover2"]
    }
  }else if(role=="Approver1"){
    if(currentPage=="approved"){
      status="AcceptedByApprover1"
    }else if(currentPage=="declineInBills"){
      multipleStatus=true;
      statuses = ["DeclineByApprover1", "DeclineByApprover2"]; 
    }
    else if(currentPage=="declineInAp"){
      status="Decline"
    }
    else if(currentPage=="pendingInBills"){
      status = 'AcceptedByAP';
    }
    else if(currentPage=="pendingInAp"){
      status="Pending"      
    }
    else if(currentPage=='all'){
      showAllStatus=true;
      allStatus=["AcceptedByAP", "AcceptedByApprover1","AcceptedByApprover2","DeclineByApprover1", "DeclineByApprover2"]
    }
  }else if(role=="Approver2"){
    if(currentPage=="approved"){
      status="AcceptedByApprover2"
    }else if(currentPage=="declineInBills"){
      multipleStatus=true;
      statuses = ["DeclineByApprover1", "DeclineByApprover2"]; 
    }
    else if(currentPage=="declineInAp"){
      status="Decline"
    }
    else if(currentPage=="pendingInBills"){
      status="AcceptedByApprover1"
    }
    else if(currentPage=="pendingInAp"){
      status="Pending"      
    }
    else if(currentPage=='all'){
      showAllStatus=true;
      allStatus=["AcceptedByAP", "AcceptedByApprover1","AcceptedByApprover2","DeclineByApprover1", "DeclineByApprover2"]
    }
  }else if(role=="DepartMentHead"){
    if(currentPage=="approved"){
      status = 'AcceptedByApprover2'
    }else if(currentPage=="declineInBills"){
      multipleStatus=true;
      statuses = ["DeclineByApprover1", "DeclineByApprover2"]; 
    }
    else if(currentPage=="pendingInBills"){
      multipleStatus=true;
      statuses = ["AcceptedByAP", "AcceptedByApprover1"];
    }
    else if(currentPage=="declineInAp"){
      status="Decline"
    }
    else if(currentPage=="pendingInAp"){
      status="Pending"      
    }
    else if(currentPage=='all'){
      showAllStatus=true;
      allStatus=["AcceptedByAP", "AcceptedByApprover1","AcceptedByApprover2","DeclineByApprover1", "DeclineByApprover2"]
    }
  }
  let sql =`
    SELECT 
      i.*, 
      v.vendor_name 
    FROM 
      Invoice AS i
    JOIN 
      VendorTable AS v ON i.vendor_id = v.vendor_id
    WHERE 
      i.status = ?; 
  `;
  if (multipleStatus) {
      sql = `SELECT 
        i.*, 
        v.vendor_name 
      FROM 
        Invoice AS i
      JOIN 
        VendorTable AS v ON i.vendor_id = v.vendor_id
      WHERE 
        i.status IN (?, ?);
    `
  }
  else if(showAllStatus){
    sql = `SELECT 
        i.*, 
        v.vendor_name 
      FROM 
        Invoice AS i
      JOIN 
        VendorTable AS v ON i.vendor_id = v.vendor_id
      WHERE 
        i.status IN (?, ?,?,?,?);
    `

  }
  let binds =[status];
  if(multipleStatus){
    binds=statuses;
  }
  else if(showAllStatus){
    binds=allStatus;
  }

  connection.execute({
    sqlText: sql,
    binds: [binds], // No bind variables needed for this query
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
const updateInvoiceStatus = (invoiceId, role, callback) => {
  let status;
  switch(role){
    case "Admin":
      status = 'Pending';
      break;
    case "ApPerson":
      status = 'AcceptedByAP';
      break;
    case "Approver1":
      status = 'AcceptedByApprover1';
      break;
    case "Approver2":
      status = 'AcceptedByApprover2';
      break;
    case "DepartMentHead":
      status = 'Pending';
      break;
    default:
      status = 'Pending'; // Default role ID if none is specified
  }
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
      if (rows && rows.length > 0) {
        // Now update the status since it's pending
        connection.execute({
          sqlText: updateQuery,
          binds: [status, invoiceId], // Bind the newStatus and invoiceId to the update query
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


const declineInvoice = (invoiceId, role, declineReason,callback) => {
    let status;
    switch(role){
      case "Admin":
        status = 'Decline';
        break;
      case "ApPerson":
        status = 'Decline';
        break;
      case "Approver1":
        status = 'DeclineByApprover1';
        break;
      case "Approver2":
        status = 'DeclineByApprover2';
        break;
      case "DepartMentHead":
        status = 'Decline';
        break;
      default:
        status = 'Decline'; // Default role ID if none is specified
    }
    const checkQuery = `
          SELECT status 
          FROM Invoice 
          WHERE case_id = ?`;
    const updateQuery = `
          UPDATE Invoice 
          SET status = ?, DECLINE_REASON=?, DECLINE_DATE=CURRENT_DATE 
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
        if (rows && rows.length > 0) {
          // Now update the status since it's pending
          connection.execute({
            sqlText: updateQuery,
            binds: [status, declineReason,invoiceId], // Bind the newStatus and invoiceId to the update query
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



const getInvoiceByCaseId = (caseId,callback)=>{
  const query = "SELECT * FROM Invoice WHERE CASE_ID = ?"; 
  connection.execute({
    sqlText: query,
    binds: [caseId],
    complete: (err, stmt, rows) => {
      if (err) {  
        return callback(err,null);
      }        
      callback(null,rows);
    },
  });
};


const getVendorByVendorId = (vendorId,callback)=>{
  const query = "SELECT * FROM VENDORTABLE WHERE VENDOR_ID = ?"; 
  connection.execute({
    sqlText: query,
    binds: [vendorId],
    complete: (err, stmt, rows) => {
      if (err) {  
        return callback(err,null);
      }        
      callback(null,rows);
    },
  });
};



// -----------------------------------chat---------------------------
const getChats = (caseId,callback) => {
  const query = "SELECT * FROM GroupChats WHERE chat_id = ?"; // Use a WHERE clause to filter by chat_id
  
  connection.execute({
    sqlText: query,
    binds: [caseId],
    complete: (err, stmt, rows) => {
      if (err) {  
        return callback(err,null);
      }        
      callback(null,rows);
    },
  });
};



// -----------------------------------chat---------------------------
const getPersonName = (callback) => {
  const query = "SELECT * FROM role"; 

  connection.execute({
    sqlText: query,
    binds: [],
    complete: (err, stmt, rows) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, rows);
    },
});
};

const updateChatMessages = (newMessages, chat_Id,callback) => {
  console.log(newMessages)
  const updateQuery = `
   MERGE INTO GroupChats AS target
    USING (SELECT ? AS chat_id, PARSE_JSON(?) AS new_message) AS source
    ON target.chat_id = source.chat_id
    WHEN MATCHED THEN 
      UPDATE SET messages = ARRAY_APPEND(COALESCE(target.messages, ARRAY_CONSTRUCT()), source.new_message)
    WHEN NOT MATCHED THEN 
      INSERT (chat_id, messages) 
      VALUES (source.chat_id, ARRAY_CONSTRUCT(source.new_message));
  `;
  connection.execute({
    sqlText: updateQuery,
    binds: [ chat_Id, JSON.stringify(newMessages)],
    complete: (err, stmt, updateRows) => {
       if (err) {
        return callback(err, null);
      }
      if (updateRows.length === 0) {
        return callback(
          new Error("No data found for the specified chat"),
          null
        );
      }
      callback(null,updateRows[0]);
      },
    });
  }



  const UpdatingChat = (messageIndex, timestamp,chat_id) => {
    console.log(chat_id)
    // const updateQuery = `
    //     WITH MessageList AS (
    //         SELECT 
    //             chat_id, 
    //             PARSE_JSON(messages) AS message_json
    //         FROM GroupChats
    //         WHERE chat_id = source.chat_id
    //     ),
    //     MatchedMessage AS (
    //         SELECT 
    //             message_obj.index AS message_index, -- Index in the JSON array
    //             message_obj.value AS message_data  -- JSON object data
    //         FROM MessageList
    //         CROSS JOIN LATERAL FLATTEN(input => message_json) AS message_obj
    //         WHERE 
    //             message_obj.value:messageIndex = 'your_message_index_value' AND
    //             message_obj.value:timestamp = 'your_timestamp_value'
    //     )
    //     DELETE FROM GroupChats
    //     WHERE chat_id = source.chat_id
    //       AND EXISTS (
    //           SELECT 1
    //           FROM MatchedMessage
    //       );
  // `;
  // const fetchChatQuery = `SELECT messages FROM GroupChats WHERE chat_id = ?`;

  // db.query(fetchChatQuery, [chat_id], (err, result) => {
  //   if (err) {
  //       res.status(500).json({ error: 'Error retrieving chat data' });
  //       return;
  //   }

  //   if (result.length === 0) {
  //       res.status(404).json({ error: 'Chat not found' });
  //       return;
  //   }

  //   // Step 2: Parse the messages JSON from the database
  //   let messages;
  //   try {
  //       messages = JSON.parse(result[0].messages);
  //   } catch (parseErr) {
  //       res.status(500).json({ error: 'Error parsing messages JSON' });
  //       return;
  //   }

  //   // Step 3: Filter out the message matching the messageIndex and timestamp
  //   const updatedMessages = messages.filter(
  //       (msg, index) =>
  //           !(index === messageIndex && msg.timestamp === timestamp)
  //   );

  //   // If no message was removed, it means no match was found
  //   if (messages.length === updatedMessages.length) {
  //       res.status(404).json({ error: 'Message not found' });
  //       return;
  //   }

  //   // Step 4: Convert the updated messages array back to JSON
  //   const updatedMessagesString = JSON.stringify(updatedMessages);

  //   // Step 5: Update the database with the filtered messages
  //   const updateQuery = `UPDATE GroupChats SET messages = ? WHERE chat_id = ?`;

  //   db.query(updateQuery, [updatedMessagesString, chat_id], (updateErr) => {
  //       if (updateErr) {
  //           res.status(500).json({ error: 'Error updating messages' });
  //           return;
  //       }

  //       res.status(200).json({ success: true, messages: updatedMessages });
  //   });

  // })

  
    // connection.execute({
    //   sqlText: updateQuery,
    //   binds: [ chat_Id, JSON.stringify(newMessages)],
    //   complete: (err, stmt, updateRows) => {
    //      if (err) {
    //       return callback(err, null);
    //     }
    //     if (updateRows.length === 0) {
    //       return callback(
    //         new Error("No data found for the specified chat"),
    //         null
    //       );
    //     }
    //     callback(null,updateRows[0]);
    //     },
    //   });
    }


  function createVendorModel(userData, callback) {
    const getMaxIdSql = "SELECT COUNT(VENDOR_ID) AS maxId FROM vendorTable";
  connection.execute({
    sqlText: getMaxIdSql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error("Error fetching max ID:", err);
        return callback("Error in generating ID"); 
      }

      let nextId;
      const currentMaxId = rows[0]?.MAXID || 1; // Default to C000 if no rows found
      nextId = `V${currentMaxId.toString()}`;
        const sql =
          "INSERT INTO VendorTable ( vendor_id,vendor_name, primary_Contact, phone_number, email_address, ein_number, street_address1, street_address2, city , state, country,zip_code, bank_name,account_holder_name ,account_type, bank_address, account_number,bic_code ) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?)";
          const values = [
            nextId,
            userData.companyName,
            userData.contactPerson,
            userData.phoneNumber,
            userData.email,
            userData.einNumber,
            userData.streetAddress1,
            userData.streetAddress2,
            userData.city,
            userData.state,
            userData.country,
            userData.zipCode,
            userData.bankName,
            userData.accountHolderName, 
            userData.accountType,
            userData.bankAddress,
             userData.accountNumber, 
            userData.swiftCode ,
          ];
          connection.execute({
            sqlText: sql,
            binds:[values],
            complete: (err, stmt, rows) => {
              if (err) {
                console.error("Error executing SQL:", err);
                return callback("Inserting data error in server");
              }
              
              // Check if rows is defined and handle accordingly
               callback(null, "Successful");
              
            },
          });
        }})
  }



// ---------------------------------------------updateAcitivityLog-------------------

const updateAcitivityLog = (newActivity,  case_id, role, callback) => {
  let status;
  switch(role){
    case "Admin":
      status = 'Pending';
      break;
    case "ApPerson":
      status = 'AcceptedByAP';
      break;
    case "Approver1":
      status = 'AcceptedByApprover1';
      break;
    case "Approver2":
      status = 'AcceptedByApprover2';
      break;
    case "DepartMentHead":
      status = 'Pending';
      break;
    default:
      status = 'Pending';
  }
 
  newActivity.status = status;

  console.log(newActivity);
  
  const updateQuery = `
  MERGE INTO AcitivityLog AS target
   USING (SELECT ? AS case_id, PARSE_JSON(?) AS newActivity) AS source
   ON target.case_id = source.case_id
   WHEN MATCHED THEN 
     UPDATE SET activities = ARRAY_APPEND(COALESCE(target.activities, ARRAY_CONSTRUCT()), source.newActivity)
   WHEN NOT MATCHED THEN 
     INSERT (case_id, activities) 
     VALUES (source.case_id, ARRAY_CONSTRUCT(source.newActivity));
 `;

 connection.execute({
   sqlText: updateQuery,
   binds: [case_id, JSON.stringify(newActivity)],
   complete: (err, stmt, updateRows) => {
      if (err) {
       return callback(err, null);
     }
     if (updateRows.length === 0) {
       return callback(
         new Error("No data found for the specified chat"),
         null
       );
     }
     
  console.log(updateRows[0]);
  
     callback(null,updateRows[0]);
     }
    })
};


// -----------------------------------chat---------------------------
const getActvityLogCase = (caseId,callback) => {
  const query = "SELECT * FROM AcitivityLog WHERE case_id = ?"; 
  
  connection.execute({
    sqlText: query,
    binds: [caseId],
    complete: (err, stmt, rows) => {
      if (err) {  
        return callback(err,null);
      }       
      console.log(rows) 
      callback(null,rows);
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
  updateInvoiceStatus,
  fetchAllDeclineInvoices,
  findRole,
  declineInvoice,

  updateAcitivityLog,
  getActvityLogCase,

  updateChatMessages,
  getChats,
  getPersonName,
  getInvoiceByCaseId,
  UpdatingChat,


  fetchAllVendors,
  getVendorByVendorId,
  createVendorModel
};
