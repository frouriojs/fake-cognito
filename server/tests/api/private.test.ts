import { expect, test } from 'vitest';
import { createUserClient, noCookieClient } from './apiClient';
import { createCognitoUserAndToken, GET } from './utils';

test(GET(noCookieClient.private), async () => {
  const userClient = await createCognitoUserAndToken().then(createUserClient);
  const res = await userClient.private.$get();

  expect(res).toEqual('');

  await expect(noCookieClient.private.get()).rejects.toHaveProperty('response.status', 401);
});

test(GET(noCookieClient.private.me), async () => {
  const userClient = await createCognitoUserAndToken().then(createUserClient);
  const res = await userClient.private.me.get();

  expect(res.status).toBe(200);
});
