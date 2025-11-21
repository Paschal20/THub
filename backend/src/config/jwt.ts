import jwt from "jsonwebtoken";
import config from "./env";

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (userId: string, role: string): string => {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = { userId, role };
  
  // Convert string to number if it's a numeric string, otherwise use as is
  const expiresIn = typeof config.jwtExpiresIn === 'string' && /^\d+$/.test(config.jwtExpiresIn)
    ? parseInt(config.jwtExpiresIn, 10)
    : config.jwtExpiresIn;

  // Use type assertion to handle the expiresIn type
  return jwt.sign(
    payload,
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn,
    } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object') {
      return decoded as TokenPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
};
