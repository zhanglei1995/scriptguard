import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { UnauthorizedError } from './errors.js'

const SALT_ROUNDS = 12

export interface TokenPayload {
  userId: string
  plan: string
}

export interface FullTokenPayload extends TokenPayload {
  iat: number
  exp: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): FullTokenPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as FullTokenPayload
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
