import {
  AdminCreateUserCommand,
  AdminDeleteUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  UserStatusType,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from 'service/cognito';
import { DEFAULT_USER_POOL_CLIENT_ID, DEFAULT_USER_POOL_ID } from 'service/envValues';
import { createUserClient, testPassword, testUserName } from 'tests/api/apiClient';
import { fetchMailBodyAndTrash, inbucketClient } from 'tests/api/utils';
import { ulid } from 'ulid';
import { expect, test } from 'vitest';

test(`${AdminCreateUserCommand.name} - specify TemporaryPassword`, async () => {
  const email = `${ulid()}@example.com`;

  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      TemporaryPassword: `TmpPass-${Date.now()}`,
      MessageAction: 'SUPPRESS',
      UserAttributes: [{ Name: 'email', Value: email }],
    }),
  );

  const mailbox = await inbucketClient.mailbox(email);

  expect(mailbox).toHaveLength(0);

  const res1 = await cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: DEFAULT_USER_POOL_ID, Username: testUserName }),
  );

  expect(res1.UserStatus).toBe(UserStatusType.FORCE_CHANGE_PASSWORD);

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      Password: testPassword,
    }),
  );

  const res2 = await cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: DEFAULT_USER_POOL_ID, Username: testUserName }),
  );

  expect(res2.UserStatus).toBe(UserStatusType.CONFIRMED);

  const tokens = await cognitoClient.send(
    new AdminInitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: DEFAULT_USER_POOL_ID,
      ClientId: DEFAULT_USER_POOL_CLIENT_ID,
      AuthParameters: { USERNAME: testUserName, PASSWORD: testPassword },
    }),
  );

  expect(tokens.AuthenticationResult).toBeTruthy();
});

test(`${AdminCreateUserCommand.name} - unset TemporaryPassword`, async () => {
  const email = `${ulid()}@example.com`;

  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      UserAttributes: [{ Name: 'email', Value: email }],
    }),
  );

  const message1 = await fetchMailBodyAndTrash(email);

  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      MessageAction: 'RESEND',
      UserAttributes: [{ Name: 'email', Value: email }],
    }),
  );

  const message2 = await fetchMailBodyAndTrash(email);

  expect(message1).toBe(message2);

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      Password: testPassword,
    }),
  );

  const res = await cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: DEFAULT_USER_POOL_ID, Username: testUserName }),
  );

  expect(res.UserStatus).toBe(UserStatusType.CONFIRMED);
});

test(AdminDeleteUserCommand.name, async () => {
  const userClient = await createUserClient();

  await cognitoClient.send(
    new AdminDeleteUserCommand({ UserPoolId: DEFAULT_USER_POOL_ID, Username: testUserName }),
  );

  await expect(userClient.private.me.get()).rejects.toThrow();
});

test(AdminUpdateUserAttributesCommand.name, async () => {
  const userClient = await createUserClient();
  const attrName1 = 'custom:test1';
  const attrVal1 = 'sample1';
  const attrName2 = 'custom:test2';
  const attrVal2 = 'sample2';
  const attrVal3 = 'sample3';

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      UserAttributes: [
        { Name: attrName1, Value: attrVal1 },
        { Name: attrName2, Value: attrVal2 },
      ],
    }),
  );

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      UserAttributes: [{ Name: attrName1, Value: attrVal3 }],
    }),
  );

  const user = await userClient.private.me.$get();
  const targetAttr1 = user.attributes.find((attr) => attr.name === attrName1);
  const targetAttr2 = user.attributes.find((attr) => attr.name === attrName2);

  expect(targetAttr1?.value).toBe(attrVal3);
  expect(targetAttr2?.value).toBe(attrVal2);
});

test(AdminDeleteUserAttributesCommand.name, async () => {
  const userClient = await createUserClient();
  const attrName1 = 'custom:test1';
  const attrName2 = 'custom:test2';

  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      UserAttributes: [
        { Name: attrName1, Value: 'sample1' },
        { Name: attrName2, Value: 'sample2' },
      ],
    }),
  );

  await cognitoClient.send(
    new AdminDeleteUserAttributesCommand({
      UserPoolId: DEFAULT_USER_POOL_ID,
      Username: testUserName,
      UserAttributeNames: [attrName1],
    }),
  );

  const user = await userClient.private.me.$get();

  expect(user.attributes.every((attr) => attr.name !== attrName1)).toBeTruthy();
  expect(user.attributes.some((attr) => attr.name === attrName2)).toBeTruthy();
});
