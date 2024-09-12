import type { Prisma } from '@prisma/client';
import assert from 'assert';
import type {
  AdminCreateUserTarget,
  AdminDeleteUserAttributesTarget,
  AdminDeleteUserTarget,
  AdminGetUserTarget,
  AdminInitiateAuthTarget,
  AdminSetUserPasswordTarget,
  AdminUpdateUserAttributesTarget,
} from 'common/types/auth';
import type { CognitoUserEntity } from 'common/types/user';
import { userPoolQuery } from 'domain/userPool/repository/userPoolQuery';
import { brandedId } from 'service/brandedId';
import { prismaClient, transaction } from 'service/prismaClient';
import { genJwks } from 'service/privateKey';
import { adminMethod } from '../model/adminMethod';
import { userMethod } from '../model/userMethod';
import { userCommand } from '../repository/userCommand';
import { userQuery } from '../repository/userQuery';
import { toAttributeTypes } from '../service/createAttributes';
import { genTokens } from '../service/genTokens';
import { sendTemporaryPassword } from '../service/sendAuthMail';

const findUser = async (
  tx: Prisma.TransactionClient,
  req: AdminCreateUserTarget['reqBody'],
): Promise<CognitoUserEntity> => {
  assert(req.Username);

  return await userQuery.findByName(tx, req.Username);
};

const createUser = async (
  tx: Prisma.TransactionClient,
  req: AdminCreateUserTarget['reqBody'],
): Promise<CognitoUserEntity> => {
  assert(req.Username);
  assert(req.UserPoolId);

  const userPool = await userPoolQuery.findById(tx, req.UserPoolId);
  const idCount = await userQuery.countId(tx, req.Username);
  const user = adminMethod.createVerifiedUser(idCount, req, userPool.id);

  await userCommand.save(tx, user);

  return user;
};

export const adminUseCase = {
  getUser: async (req: AdminGetUserTarget['reqBody']): Promise<AdminGetUserTarget['resBody']> => {
    assert(req.Username);
    const user = await userQuery.findByName(prismaClient, req.Username);
    assert(user.userPoolId === req.UserPoolId);

    return { Username: user.name, UserAttributes: toAttributeTypes(user), UserStatus: user.status };
  },
  createUser: (req: AdminCreateUserTarget['reqBody']): Promise<AdminCreateUserTarget['resBody']> =>
    transaction(async (tx) => {
      const user = await (req.MessageAction === 'RESEND' ? findUser : createUser)(tx, req);

      if (req.MessageAction !== 'SUPPRESS') await sendTemporaryPassword(user);

      return {
        User: { Username: user.name, Attributes: toAttributeTypes(user), UserStatus: user.status },
      };
    }),
  deleteUser: (req: AdminDeleteUserTarget['reqBody']): Promise<AdminDeleteUserTarget['resBody']> =>
    transaction(async (tx) => {
      assert(req.Username);
      assert(req.UserPoolId);

      const user = await userQuery.findByName(tx, req.Username);
      const deletableId = adminMethod.deleteUser(user, req.UserPoolId);

      await userCommand.delete(tx, deletableId, user.attributes);

      return {};
    }),
  initiateAuth: (
    req: AdminInitiateAuthTarget['reqBody'],
  ): Promise<AdminInitiateAuthTarget['resBody']> =>
    transaction(async (tx) => {
      assert(req.UserPoolId);
      assert(req.AuthParameters);

      const user = await userQuery.findByName(tx, req.AuthParameters.USERNAME);
      const pool = await userPoolQuery.findById(tx, req.UserPoolId);
      const poolClient = await userPoolQuery.findClientById(
        tx,
        brandedId.userPoolClient.maybe.parse(req.ClientId),
      );
      const jwks = await genJwks(pool.privateKey);
      const tokens = genTokens({
        privateKey: pool.privateKey,
        userPoolClientId: poolClient.id,
        jwks,
        user,
      });

      return {
        AuthenticationResult: {
          ...tokens,
          ExpiresIn: 3600,
          RefreshToken: user.refreshToken,
          TokenType: 'Bearer',
        },
      };
    }),
  setUserPassword: (
    req: AdminSetUserPasswordTarget['reqBody'],
  ): Promise<AdminSetUserPasswordTarget['resBody']> =>
    transaction(async (tx) => {
      assert(req.Username);

      const user = await userQuery.findByName(tx, req.Username);

      await userCommand.save(tx, adminMethod.setUserPassword(user, req));

      return {};
    }),
  updateUserAttributes: (
    req: AdminUpdateUserAttributesTarget['reqBody'],
  ): Promise<AdminUpdateUserAttributesTarget['resBody']> =>
    transaction(async (tx) => {
      assert(req.Username);

      const user = await userQuery.findByName(tx, req.Username);

      await userCommand.save(tx, adminMethod.updateAttributes(user, req.UserAttributes));

      return {};
    }),
  deleteUserAttributes: (
    req: AdminDeleteUserAttributesTarget['reqBody'],
  ): Promise<AdminDeleteUserAttributesTarget['resBody']> =>
    transaction(async (tx) => {
      assert(req.Username);

      const user = await userQuery.findByName(tx, req.Username);

      await userCommand.save(tx, userMethod.deleteAttributes(user, req.UserAttributeNames));

      return {};
    }),
};
