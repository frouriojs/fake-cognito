import { UserStatusType } from '@aws-sdk/client-cognito-identity-provider';
import type { User, UserAttribute } from '@prisma/client';
import { USER_KINDS } from 'common/constants';
import type { CognitoUserEntity, UserAttributeEntity } from 'common/types/user';
import { brandedId } from 'service/brandedId';
import { z } from 'zod';

const getChallenge = (prismaUser: User): CognitoUserEntity['challenge'] =>
  prismaUser.secretBlock && prismaUser.pubA && prismaUser.pubB && prismaUser.secB
    ? {
        secretBlock: prismaUser.secretBlock,
        pubA: prismaUser.pubA,
        pubB: prismaUser.pubB,
        secB: prismaUser.secB,
      }
    : undefined;

export const toUserEntity = (
  prismaUser: User & { attributes: UserAttribute[] },
): CognitoUserEntity => {
  return {
    id: brandedId.cognitoUser.entity.parse(prismaUser.id),
    kind: z.literal(USER_KINDS.cognito).parse(prismaUser.kind),
    name: prismaUser.name,
    enabled: prismaUser.enabled,
    status: z
      .enum([
        UserStatusType.UNCONFIRMED,
        UserStatusType.CONFIRMED,
        UserStatusType.FORCE_CHANGE_PASSWORD,
        UserStatusType.RESET_REQUIRED,
      ])
      .parse(prismaUser.status),
    email: prismaUser.email,
    password: prismaUser.password,
    salt: prismaUser.salt,
    verifier: prismaUser.verifier,
    refreshToken: prismaUser.refreshToken,
    confirmationCode: prismaUser.confirmationCode,
    challenge: getChallenge(prismaUser),
    userPoolId: brandedId.userPool.entity.parse(prismaUser.userPoolId),
    attributes: prismaUser.attributes.map(
      (attr): UserAttributeEntity => ({
        id: brandedId.userAttribute.entity.parse(attr.id),
        name: attr.name,
        value: attr.value,
      }),
    ),
    createdTime: prismaUser.createdAt.getTime(),
    updatedTime: prismaUser.updatedAt.getTime(),
  };
};
