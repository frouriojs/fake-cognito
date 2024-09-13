export const APP_NAME = 'Magnito';

export const BRANDED_ID_NAMES = [
  'cognitoUser',
  'socialUser',
  'userAttribute',
  'deletableUser',
  'userPool',
  'userPoolClient',
] as const;

export const USER_KIND_LIST = ['social', 'cognito'] as const;

export const PROVIDER_LIST = ['Google', 'Apple', 'Amazon', 'Facebook'] as const;

const listToDict = <T extends readonly [string, ...string[]]>(list: T): { [U in T[number]]: U } =>
  list.reduce((dict, type) => ({ ...dict, [type]: type }), {} as { [U in T[number]]: U });

export const USER_KINDS = listToDict(USER_KIND_LIST);
