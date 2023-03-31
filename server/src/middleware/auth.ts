import jwt, { Algorithm } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';

export interface JWTRequest extends Request {
  token?: string;
  tokenDecoded?: Record<string, string | boolean>;
}

const tokenExpiration = '24h';
const refreshTokenExpiration = '30d';
const jwtOptions = {
  issuer: 'resolution',
  algorithm: 'HS256' as Algorithm,
};

/**
 * Get global secret from config.
 * Set new secret if not exists.
 *
 * @returns {string}
 */
function getSecret() {
  if (!process.env.SECRET) {
    throw new Error(`'SECRET' not set in environment variables.`);
  }

  return process.env.SECRET;
}

/**
 * Generate random string of given length.
 *
 * @param {number} length
 * @returns {string}
 */
function getRandom(length: number) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate JWT from payload.
 * Adding salt to payload to make each token unique
 * (even those generated within the same second).
 *
 * @param {Record<string, string | boolean>} payload
 * @returns {string}
 */
function generateToken(
  payload: Record<string, string | boolean>,
  refresh?: boolean
) {
  return jwt.sign({ ...payload, salt: getRandom(8) }, getSecret(), {
    ...jwtOptions,
    expiresIn: refresh ? refreshTokenExpiration : tokenExpiration,
  });
}

/**
 * Check if user is authenticated.
 * Used as Express middleware.
 *
 * @param {boolean} needsAdmin
 * @returns {(req: JWTRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>}
 */
function isAuthenticated(needsAdmin = false) {
  return async function auth(
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) {
    // Get secret for signing token
    const secret = getSecret();

    // Extract token from request
    let token =
      req.headers['x-access-token'] ||
      req.headers.authorization ||
      req.body.token ||
      req.query.token;

    if (token) {
      // Extract token from auth header
      token = token.startsWith('Bearer') ? token.split(' ')[1] : token;

      try {
        // Verify token
        const decoded = jwt.verify(token, secret, jwtOptions) as {
          isAdmin: boolean;
          username: string;
        };

        // Check permissions
        if (needsAdmin && !decoded.isAdmin) {
          res.sendStatus(403);
          return;
        }

        // Make token available to controller
        (req as JWTRequest).token = token;
        (req as JWTRequest).tokenDecoded = decoded;
        next();
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'TokenExpiredError') {
          // Token expired
          res.status(401).json({ msg: 'TokenExpired' });
          return;
        }

        // Token invalid
        res.sendStatus(401);
      }
    } else {
      // No token provided
      res.sendStatus(401);
    }
  };
}

export default {
  generateToken,
  isAuthenticated,
};
