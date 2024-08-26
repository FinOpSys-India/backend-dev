// const express = require('express');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const cookieParser = require('cookie-parser');
// const jwt = require('jsonwebtoken');
// const bodyParser = require('body-parser');
// const snowflake = require('snowflake-sdk');
// require('dotenv').config();

// const saltRounds = 10;
// const app = express();

// // Middleware setup
// app.use(express.json());
// app.use(cors({
//     origin: ["http://localhost:3000"],
//     methods: ["POST", "GET"],
//     credentials: true
// }));

// app.use(cookieParser());



// // Snowflake connection
// const connection = snowflake.createConnection({
//     account: 'yqsrexc-ly17319',
//     username: 'pratibha',
//     password: 'Pratibha@1',
//     warehouse: 'FINOPSYS_WH',
//     database: 'FINOPSYS_DB',
//     schema: 'PUBLIC',
//     role: 'ACCOUNTADMIN'
// });

// connection.connect((err, conn) => {
//     if (err) {
//         console.error('Unable to connect: ' + err.message);
//     } else {
//         console.log('Successfully connected to Snowflake.');
//     }
// });



// // Token verification middleware
// const verifyUser = (req, res, next) => {
//     const token = req.cookies.token;
//     if (!token) {
//         return res.json({ Error: "You are not authenticated" });
//     } else {
//         jwt.verify(token, "jwt-secret-key", (err, decoded) => {
//             if (err) {
//                 return res.json({ Error: "Problem with token" });
//             } else {
//                 console.log("Generated token:", token);
//                 req.firstName = decoded.firstName;
//                 next();
//             }
//         });
//     }
// };

// app.get("/", verifyUser, (req, res) => {
//     return res.json({ Status: "Successful", firstName: req.firstName });
// });

// app.post("/signup", (req, res) => {
//     const sql = "INSERT INTO signUp_userData ( firstName, lastName,workEmail, companyName, companyType, phoneNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?)";

//     bcrypt.hash(req.body.password.toString(), saltRounds, (err, hash) => {
//         if (err) {
//             return res.json({ Error: "Error in hashing password" });
//         }

//         const values = [
//             req.body.firstName,
//             req.body.lastName,
//             req.body.workEmail,
//             req.body.companyName,
//             req.body.companyType,
//             req.body.phoneNumber,
//             hash
//         ];

//         connection.execute({
//             sqlText: sql,
//             binds: values,
//             complete: (err, stmt, rows) => {
//                 if (err) {
//                     console.error('Failed to execute statement due to the following error: ' + err.message);
//                     return res.json({ Error: "Inserting data error in server" });
//                 }
//                 return res.json({ Status: "Successful" });
//             }
//         });
//     });
// });



// app.post("/login", (req, res) => {
//     const sql = 'SELECT * FROM signUp_userData WHERE workEmail = ?';
//     connection.execute({
//         sqlText: sql,
//         binds: [req.body.workEmail],
//         complete: (err, stmt, rows) => {
//             if (err) {
//                 return res.json({ Error: "Login error in the server" });
//             }
//             if (rows.length > 0) {
//                 console.log("rows"+ rows)
//                 bcrypt.compare(req.body.password.toString(), rows[0].PASSWORD, (err, response) => {
//                     if (err) {
//                         return res.json({ Error: "Error in comparing password" });
//                     }
//                     if (response) {
//                         const name = rows[0].NAME;
//                         const token = jwt.sign({ name }, "jwt-secret-key", { expiresIn: "30d" });
//                         res.cookie("token", token,);
//                         return res.json({ Status: "Successful" });
//                     } else {
//                         return res.json({ Error: "Password not matching" });
//                     }
//                 });
//             } else {
//                 return res.json({ Error: "No email exists" });
//             }
//         }
//     });
// });



// // app.get("/logout", (req, res) => {
// //     res.clearCookie("token");
// //     return res.json({ Status: "Successful" });
// // });

// app.listen(9000, () => {
//     console.log("Server is listening and running on port 9000");
// });




// index.js

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/routes');
require('dotenv').config();

const app = express();


app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}));


app.use(cookieParser());


app.use('/', routes);

const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`Server is listening and running on port ${port}`);
});