import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";


export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User' });
        }

        //redis is used to store the token if the isBlackListed is true then the token is blacklisted and user is unauthorized
        const isBlackListed = await redisClient.get(token);

        if (isBlackListed) {
            res.cookie('token', '');
            return res.status(401).send({ error: 'Unauthorized User' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {

        console.log(error);

        res.status(401).send({ error: 'Unauthorized User' });
    }
}


/*
**`middleware/auth.middleware.js`**:
    - **Authentication Middleware**: Contains middleware functions (likely named `protectRoute` or similar) to verify JWT tokens sent in request headers (usually `Authorization: Bearer <token>`) or cookies.
    - **Token Verification**: Decodes and verifies the JWT token using a secret key.
    - **User Identification**: If the token is valid, it extracts the user ID and attaches the corresponding user object (fetched from the database) to the `req` object (e.g., `req.user`), making it available to subsequent controllers.
    - **Authorization**: Protects specific routes, ensuring only authenticated users can access them.
*/

/*
Incoming Request
      ↓
Read token → from cookies or Authorization header
      ↓
No token? → 401 Unauthorized
      ↓
Check Redis if token is blacklisted
      ↓
Blacklisted? → Clear cookie + 401 Unauthorized
      ↓
Verify token with JWT secret
      ↓
Invalid/Expired? → 401 Unauthorized
      ↓
Attach decoded payload to req.user
      ↓
next() → Route handler executes

*/