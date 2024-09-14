import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import type { UserAttributeEntity, UserEntity } from 'common/types/user';
import { brandedId } from 'service/brandedId';
import { ulid } from 'ulid';
import { z } from 'zod';
import { isEmailVerified } from './isEmailVerified';

export const COMPUTED_ATTRIBUTE_NAMES = ['sub', 'email', 'email_verified', 'updated_at'] as const;

export const STANDARD_ATTRIBUTE_NAMES = [
  'address',
  'birthdate',
  'family_name',
  'gender',
  'given_name',
  'locale',
  'middle_name',
  'name',
  'nickname',
  'phone_number',
  'picture',
  'preferred_username',
  'profile',
  'website',
  'zoneinfo',
] as const;

export const toAttributeTypes = (user: UserEntity): AttributeType[] => {
  return user.kind === 'cognito'
    ? [
        { Name: 'sub', Value: user.id },
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: isEmailVerified(user) ? 'true' : 'false' },
        { Name: 'updated_at', Value: Math.floor(user.updatedTime / 1000).toString() },
        ...user.attributes.map((attr) => ({ Name: attr.name, Value: attr.value })),
      ]
    : [
        { Name: 'sub', Value: user.id },
        { Name: 'updated_at', Value: Math.floor(user.updatedTime / 1000).toString() },
        ...user.attributes.map((attr) => ({ Name: attr.name, Value: attr.value })),
      ];
};

export const createAttributes = (
  attributes: AttributeType[],
  exists: UserAttributeEntity[],
): UserAttributeEntity[] => [
  ...exists.filter((entity) => attributes.every((attr) => attr.Name !== entity.name)),
  ...attributes
    .filter((attr) => COMPUTED_ATTRIBUTE_NAMES.every((name) => name !== attr.Name))
    .map((attr) => ({
      id:
        exists.find((entity) => entity.name === attr.Name)?.id ??
        brandedId.userAttribute.entity.parse(ulid()),
      name: z.enum(STANDARD_ATTRIBUTE_NAMES).or(z.string().startsWith('custom:')).parse(attr.Name),
      value: z.string().parse(attr.Value),
    })),
];
