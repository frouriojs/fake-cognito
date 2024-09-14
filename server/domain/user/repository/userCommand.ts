import type { Prisma } from '@prisma/client';
import type { EntityId } from 'common/types/brandedId';
import type { UserAttributeEntity, UserEntity } from 'common/types/user';

export const userCommand = {
  save: async (tx: Prisma.TransactionClient, user: UserEntity): Promise<void> => {
    await tx.userAttribute.deleteMany({ where: { userId: user.id } });

    await tx.user.upsert({
      where: { id: user.id },
      update: {
        kind: user.kind,
        email: user.email,
        name: user.name,
        enabled: user.enabled,
        provider: user.provider,
        status: user.status,
        password: user.password,
        salt: user.salt,
        verifier: user.verifier,
        refreshToken: user.refreshToken,
        confirmationCode: user.confirmationCode,
        authorizationCode: user.authorizationCode,
        codeChallenge: user.codeChallenge,
        secretBlock: user.challenge?.secretBlock,
        pubA: user.challenge?.pubA,
        pubB: user.challenge?.pubB,
        secB: user.challenge?.secB,
        attributes: { createMany: { data: user.attributes } },
        updatedAt: new Date(user.updatedTime),
      },
      create: {
        id: user.id,
        kind: user.kind,
        email: user.email,
        name: user.name,
        enabled: user.enabled,
        provider: user.provider,
        status: user.status,
        password: user.password,
        salt: user.salt,
        verifier: user.verifier,
        refreshToken: user.refreshToken,
        confirmationCode: user.confirmationCode,
        authorizationCode: user.authorizationCode,
        codeChallenge: user.codeChallenge,
        userPoolId: user.userPoolId,
        attributes: { createMany: { data: user.attributes } },
        createdAt: new Date(user.createdTime),
        updatedAt: new Date(user.updatedTime),
      },
    });
  },
  delete: async (
    tx: Prisma.TransactionClient,
    deletableUserId: EntityId['deletableUser'],
    attributes: UserAttributeEntity[],
  ): Promise<void> => {
    await tx.userAttribute.deleteMany({ where: { id: { in: attributes.map((attr) => attr.id) } } });
    await tx.user.delete({ where: { id: deletableUserId } });
  },
};
