// verifyUser.js

const jwt = require('jsonwebtoken');

function verifyUser(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ Error: "You are not authenticated" });
    }

    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ Error: "Problem with token" });
        }

        // If token is valid, add decoded data to request object
        req.firstName = decoded.firstName;
        next();
    });
}



// function verifyMember(req, res, next) {
//     const memberToken = req.cookies.memberToken;

//     if (!memberToken) {
//         return res.status(401).json({ Error: "You are not authenticated" });
//     }

//     jwt.verify(memberToken, "jwt-secret-key", (err, decoded) => {
//         if (err) {
//             return res.status(401).json({ Error: "Problem with token" });
//         }

//         // If token is valid, add decoded data to request object
//         req.firstName = decoded.firstName;
//         next();
//     });
// }

module.exports = verifyUser;
