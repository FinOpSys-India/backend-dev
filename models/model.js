const snowflake = require('snowflake-sdk');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const saltRoundMember = 10;



const connection = snowflake.createConnection({
    // account: 'yqsrexc-ly17319',
    // account:"qhmklcx-yi73884",
    account:"zsihnyq-iq59829",
    username: '1pratibha',
    password: 'Pratibha@1',
    warehouse: 'FINOPSYS_WH',
    database: 'FINOPSYS_DB',
    schema: 'PUBLIC',
    role: 'ACCOUNTADMIN'
});


connection.connect((err, conn) => {
    if (err) {
        console.error('Unable to connect: ' + err.message);
    } else {
        console.log('Successfully connected to Snowflake.');
    }
});



// --------------------------------------quick book-------------------------------------------------
const OAuthClient = require('intuit-oauth');
require('dotenv').config();

const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    environment: process.env.ENVIRONMENT,
    redirectUri: process.env.REDIRECT_URL
});


const initiateAuth = (req, res) => {
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: '5banyuniquestringb'
    });
    res.json({ url: authUri });
};

const handleCallback = async (req, res) => {
    const parseRedirect = req.url;

    try {
        const authResponse = await oauthClient.createToken(parseRedirect);
        res.redirect('http://localhost:3000/');
    } catch (e) {
        console.error('Error during OAuth callback:', e);
        res.redirect('http://localhost:3000/error'); 
    }
};



const updateQuickbookActiveness = (userData, callback) => {
    
    // if (!userData || !Array.isArray(userData) || userData.length === 0 || typeof userData[0].quickbookActiveness === 'undefined' || !userData[0].firstName) {
    //     console.error('Invalid userData:', userData);
    //     return callback("Invalid data received");
    // }
    
    console.log("user"+ userData.firstName)
    const sql = `
      UPDATE signUp_userData SET quickbookActiveness = ? WHERE firstName = ?`;

      const data = userData;

    const values = [
        Boolean(data.quickbookActiveness), // Ensure quickbookActiveness is a boolean
        data.firstName // Use firstName to identify the record
     ] ;

     
    console.log(" values:", values)

    // Execute the SQL statement
    connection.execute({
        sqlText: sql,
        binds: values,
        complete: (err, stmt, rows) => {
            if (err) {
                console.error('Error executing SQL statement:', err);
                return callback("Error updating quickbookActiveness in server");
            }
            callback(null, "Update successful");
        }
    });
};






function getquickbookIntegration(firstName, callback) {
        const sql = "SELECT quickbookActiveness FROM signUp_userData WHERE firstName = ?";
    
        connection.execute({
            sqlText: sql,
            binds: [firstName],
            complete: (err, stmt, rows) => {
                if (err) {
                    return callback(err, null);
                }
                if (rows.length === 0) {
                    return callback(new Error('No data found for the specified name'), null);
                }
    
                console.log("Fetched quickbookActiveness:" + rows[0].QUICKBOOKACTIVENESS);
                const quickbookActiveness = rows[0].QUICKBOOKACTIVENESS;
                console.log(`Fetched quickbookActiveness: ${quickbookActiveness}`);
                callback(null, { quickbookActiveness });
            }
        });
}



// -----------------------------------------userName insert---------------------------

function createUser(userData, callback) {
    const sql = "INSERT INTO signUp_userData (firstName, lastName, workEmail, companyName, companyType, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?)";

    bcrypt.hash(userData.password.toString(), saltRounds, (err, hash) => {
        if (err) {
            return callback("Error in hashing password");
        }

        const values = [
            userData.firstName,
            userData.lastName,
            userData.workEmail,
            userData.companyName,
            userData.companyType,
            userData.phoneNumber,
            hash
        ];

        connection.execute({
            sqlText: sql,
            binds: values,
            complete: (err, stmt, rows) => {
                if (err) {
                    console.error("Error executing SQL:", err);
                    return callback("Inserting data error in server");
                }
        
                // Log values and rows to check their contents
                console.log("Values:", values);
                console.log("Rows:", rows);
        
                // Check if rows is defined and handle accordingly
                if (rows !== undefined) {
                    // Perform operations with rows if needed
                    console.log("Rows received:", rows);
                    callback(null, "Successful");
                } else {
                    callback("No rows returned from the query");
                }
            }
        });
        
    });
}



function findUserByEmail(email, callback) {
    const sql = 'SELECT * FROM signUp_userData WHERE workEmail = ?';
    connection.execute({
        sqlText: sql,
        binds: [email],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback("Login error in the server");
            }
            callback(null, rows);
        }
    });
}


                  

function findUserByPhone(phoneNumber, callback) {
    const sql = 'SELECT * FROM signUp_userData WHERE phoneNumber = ?';
    // console.log(phoneNumber+" my phone numbetr")
    connection.execute({
        sqlText: sql,
        binds: [phoneNumber],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback("Login error in the server");
            }
            callback(null, rows);
        }
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
                }
            });
        });
}




function getLoginPersonDetails(loginName, callback) {
    const sql = 'SELECT * FROM signUp_userData WHERE firstname = ?';

    connection.execute({
        sqlText: sql,
        binds: [loginName],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback("Server error during login");
            }
            callback(null, rows);
        }
    });
}






// --------------------access control boolean ----------------------


function createAcessControl(userData, callback) {
    // const sql = "INSERT INTO booleanData (generalAccess, notification, page1) VALUES (?, ?, ?)";

    const sql = " UPDATE booleanData SET generalAccess = ?, notification = ?, page1 = ? "

        const values = [
            Boolean(userData.generalAccess), 
            Boolean(userData.notification), 
            Boolean(userData.page1)       
        ];

        // console.log("valuse"+ userData.notification)
        connection.execute({
            sqlText: sql,
            binds: values,
            complete: (err, stmt, rows) => {
                if (err) {
                    return callback("Inserting data error in server");
                }
                callback(null, "Successful");
            }
        });
}


function getAccessControl(req, callback) {
    const name = req.query.name || 'pratibha';
    const sql = "SELECT * FROM booleanData WHERE name = ?";

    connection.execute({
        sqlText: sql,
        binds: [name],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback(err, null);
            }
            if (rows.length === 0) {
                return callback(new Error('No data found for the specified name'), null);
            }
            const accessControl = rows[0]; // Assuming rows[0] contains the data
            
            console.log(accessControl  + sql)
            callback(null, accessControl);
        }
    });
}


// ---------------------------------------------------Memeber sections--------------------------------------------------------------

function createMemberOfCompany(userData, callback) {
    const sql = "INSERT INTO signUp_MemberData (firstName, lastName, workEmail, companyName, memberPosition, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?)";

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
            hash
        ];

        
        connection.execute({
            sqlText: sql,
            binds: [values],
            complete: (err, stmt, rows) => {
                if (err) {
                    console.log(err)
                    return callback("Inserting data error in server");
                }
                callback(null, "Successful");
            }
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
    const sql = 'SELECT * FROM signUp_MemberData WHERE workEmail = ?';

    const emailStr = email.toString();

    connection.execute({
        sqlText: sql,
        binds: [emailStr],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback("Login error in the server");
            }
            callback(null, rows);
        }
    });
}



function findCompanyMemberByPhone(phoneNumber, callback) {
    const sql = 'SELECT * FROM signUp_MemberData WHERE phoneNumber = ?';
    // console.log(phoneNumber+" my phone numbetr")
    connection.execute({
        sqlText: sql,
        binds: [phoneNumber],
        complete: (err, stmt, rows) => {
            if (err) {
                return callback("Login error in the server");
            }
            callback(null, rows);
        }
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
                }
            });
        });
}







// ------------------------------------------------------------------------------Company details ( inserting )----------------------------------------------------

const insertCompanyDetails = (companyLogo, companyName, legalName, eid, phoneNumber, email, industryType, taxForm, callback) => {
    const sql = `
      INSERT INTO companyDetails (companyLogo, companyName, legalName, eid, phoneNumber, email, industryType, taxForm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
const fetchAllCompanies = (callback) => {
    const sql = ` SELECT companyLogo, companyName, eid, legalName, phoneNumber, email, industryType, taxForm
      FROM companyDetails;
    `;
  
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        callback(err, rows);
      },
    });
  };
  



  // ------------------------------------------------- fetch company details by EID -----------------------------------------------
const fetchCompanyByEid = (eid, callback) => {
    const sql = 'SELECT * FROM companyDetails WHERE eid = ?';
  
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
    const sql = 'SELECT * FROM companyDetails WHERE email = ?';
  
    connection.execute({
      sqlText: sql,
      binds: [email],
      complete: (err, stmt, rows) => {
        if (err) {
          return callback(err, null);
        }
        if (rows.length === 0) {
          return callback(new Error('No data found for the specified email'), null);
        }
        const updateCompany = rows[0]; // Assuming rows[0] contains the data
        callback(null, updateCompany);
      },
    });
  };
  


  //---------- function to update company details by email--------------
  function updateCompanyByEmail(
    companyLogo,
    companyName,
    legalName,
    phoneNumber,
    eid,
    email,
    industryType,
    taxForm,email,callback) {

    let sql = `
    UPDATE companyDetails SET companyName = '${companyName}', legalName = '${legalName}', phoneNumber = '${phoneNumber}', eid = '${eid}', industryType = '${industryType}', taxForm = '${taxForm}' WHERE email = '${email}';
    `;
    let binds = [
        companyName,  
        legalName,    
        phoneNumber,  
        eid,          
        industryType, 
        taxForm,      
        email                 
        ];
    if(companyLogo!=null){
        sql = `
    UPDATE companyDetails SET companyLogo = '${companyLogo}', companyName = '${companyName}', legalName = '${legalName}', phoneNumber = '${phoneNumber}', eid = '${eid}', industryType = '${industryType}', taxForm = '${taxForm}' WHERE email = '${email}';
    `;
     binds = [
        companyLogo, 
        companyName,  
        legalName,    
        phoneNumber,  
        eid,          
        industryType, 
        taxForm,      
        email                 
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
    updateCompanyByEmail,


    initiateAuth,
    handleCallback,
    updateQuickbookActiveness,
    getquickbookIntegration

};
