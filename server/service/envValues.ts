import dotenv from 'dotenv';
import { z } from 'zod';
import rootPackage from '../../package.json';
import { brandedId } from './brandedId';

dotenv.config();

const APP_VERSION = `v${z.string().parse(rootPackage.version)}`;
const PORT = +z.string().regex(/^\d+$/).parse(process.env.PORT);
const SMTP_HOST = z.string().parse(process.env.SMTP_HOST);
const SMTP_PASS = z.string().parse(process.env.SMTP_PASS);
const SMTP_PORT = +z.string().regex(/^\d+$/).parse(process.env.SMTP_PORT);
const SMTP_USER = z.string().parse(process.env.SMTP_USER);
const ACCESS_KEY = z.string().parse(process.env.COGNITO_ACCESS_KEY);
const REGION = z.string().parse(process.env.COGNITO_REGION);
const SECRET_KEY = z.string().parse(process.env.COGNITO_SECRET_KEY);
const DEFAULT_USER_POOL_ID = brandedId.userPool.entity.parse(process.env.COGNITO_USER_POOL_ID);
const DEFAULT_USER_POOL_CLIENT_ID = brandedId.userPoolClient.entity.parse(
  process.env.COGNITO_USER_POOL_CLIENT_ID,
);

export {
  ACCESS_KEY,
  APP_VERSION,
  DEFAULT_USER_POOL_CLIENT_ID,
  DEFAULT_USER_POOL_ID,
  PORT,
  REGION,
  SECRET_KEY,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
};
