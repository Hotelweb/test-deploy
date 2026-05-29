import { ForbiddenException } from '@nestjs/common';
import { assertHotelAccess } from './hotel-access';
import type { TokenPayload } from './token.service';

describe('assertHotelAccess', () => {
  it('allows system admins to access any hotel', () => {
    const user = {
      sub: 1,
      email: 'root@test',
      scope: 'system',
    } as TokenPayload;

    expect(() => assertHotelAccess(user, 99)).not.toThrow();
  });

  it('allows hotel admins to access their own hotel', () => {
    const user = {
      sub: 2,
      email: 'hotel@test',
      scope: 'hotel',
      hotel_id: 10,
    } as TokenPayload;

    expect(() => assertHotelAccess(user, 10)).not.toThrow();
  });

  it('blocks hotel admins from other hotels', () => {
    const user = {
      sub: 2,
      email: 'hotel@test',
      scope: 'hotel',
      hotel_id: 10,
    } as TokenPayload;

    expect(() => assertHotelAccess(user, 11)).toThrow(ForbiddenException);
  });
});
