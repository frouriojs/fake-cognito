import { DEFAULT_USER_POOL_CLIENT_ID } from 'service/envValues';
import { expect, test } from 'vitest';
import { noCookieClient } from './apiClient';

test('InitiateAuth', async () => {
  const res = await noCookieClient.$post({
    headers: { 'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth' },
    body: {
      AuthFlow: 'USER_SRP_AUTH',
      AuthParameters: { USERNAME: 'user', SRP_A: 'string' },
      ClientId: DEFAULT_USER_POOL_CLIENT_ID,
    },
  });

  expect(res).toHaveProperty('ChallengeName');
});

test('VerifierAuth', async () => {
  const res = await noCookieClient.$post({
    headers: { 'x-amz-target': 'AWSCognitoIdentityProviderService.VerifierAuth' },
    body: {
      ChallengeName: 'PASSWORD_VERIFIER',
      ChallengeResponses: {
        PASSWORD_CLAIM_SECRET_BLOCK: 'string',
        PASSWORD_CLAIM_SIGNATURE: 'string',
        TIMESTAMP: 'string',
        USERNAME: 'user',
      },
      ClientId: DEFAULT_USER_POOL_CLIENT_ID,
    },
  });

  expect(res).toHaveProperty('AuthenticationResult');
});

test('Attributes', async () => {
  const res = await noCookieClient.$post({
    headers: { 'x-amz-target': 'AWSCognitoIdentityProviderService.Attributes' },
    body: { AccessToken: 'string' },
  });

  expect(res).toHaveProperty('UserAttributes');
});
