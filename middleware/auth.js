import jwt from 'jsonwebtoken';
import { createRequire } from "module"; //line added to support require for jwt
const require = createRequire(import.meta.url); //line added to support require for jwt at line
require("dotenv").config(); //this require

const JWT_SECRET = process.env.JWT_AUTH_KEY;

function authenticateToken(token) {
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return [true, verified];
  } catch (error) {
    if (error.name == 'TokenExpiredError' && error.message == 'jwt expired') {
      console.log('Le token est expiré.');
    };
    return [false, null];
  };
}

export default authenticateToken;