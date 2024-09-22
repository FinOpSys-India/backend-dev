const jwt = require('jsonwebtoken');


function verifyMember(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ Error: 'No token provided' });
      }
      const memberToken = authHeader.split(' ')[1];

    if (!memberToken) {
        return res.status(401).json({ Error: "You are not authenticated" });
    }

    jwt.verify(memberToken, "jwt-secret-key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ Error: "Problem with token" });
        }

        // If token is valid, add decoded data to request object
        req.firstName = decoded.firstName;
        next();
    });
}

module.exports = verifyMember;