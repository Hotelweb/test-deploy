import { ForbiddenException } from '@nestjs/common';
import { ChatController } from './chat.controller';
import type { TokenPayload } from '../auth/token.service';

describe('ChatController ownership', () => {
  function createController(sessionHotelId: number) {
    const chatService = {
      getSession: jest.fn().mockResolvedValue({
        id: 5,
        hotel_id: sessionHotelId,
      }),
      sendStaffMessage: jest.fn(),
    };
    const translationService = { translate: jest.fn() };
    const controller = new ChatController(
      chatService as never,
      translationService as never,
    );
    return { controller, chatService };
  }

  it('blocks staff replies to another hotel conversation', async () => {
    const { controller } = createController(2);
    const user = {
      sub: 7,
      email: 'staff@test',
      scope: 'hotel',
      hotel_id: 1,
    } as TokenPayload;

    await expect(
      controller.sendStaffMessage(
        5,
        { message: 'Hello', source_language: 'vi' },
        user,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows staff replies for their own hotel conversation', async () => {
    const { controller, chatService } = createController(1);
    chatService.sendStaffMessage.mockResolvedValue({ id: 10 });
    const user = {
      sub: 7,
      email: 'staff@test',
      scope: 'hotel',
      hotel_id: 1,
    } as TokenPayload;

    await expect(
      controller.sendStaffMessage(
        5,
        { message: 'Hello', source_language: 'vi' },
        user,
      ),
    ).resolves.toEqual({ id: 10 });
  });
});
