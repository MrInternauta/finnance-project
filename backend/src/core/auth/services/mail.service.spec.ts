import { ConfigType } from '@nestjs/config';

import { config } from '../../../config';
import { MailService } from './mail.service';

describe('MailService', () => {
  const buildConfig = (overrides: Partial<ConfigType<typeof config>> = {}) =>
    ({
      resend_api_key: 're_test',
      resend_from: 'Finnance <no-reply@test.dev>',
      frontend_url: 'http://localhost:8100',
      ...overrides,
    } as ConfigType<typeof config>);

  it('resolves without throwing when the provider returns an error', async () => {
    const service = new MailService(buildConfig());
    (service as any).resend = {
      emails: {
        send: jest.fn().mockResolvedValue({ data: null, error: { name: 'rate_limited', message: 'too many' } }),
      },
    };
    const loggerError = jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);

    await expect(service.sendPasswordReset('a@b.com', 'http://link?token=secret')).resolves.toBeUndefined();
    const logged = loggerError.mock.calls.flat().join(' ');
    expect(logged).toContain('rate_limited');
    expect(logged).not.toContain('secret');
  });

  it('resolves without throwing when the provider throws', async () => {
    const service = new MailService(buildConfig());
    (service as any).resend = {
      emails: { send: jest.fn().mockRejectedValue(new Error('network down')) },
    };
    const loggerError = jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);

    await expect(service.sendPasswordReset('a@b.com', 'http://link?token=secret')).resolves.toBeUndefined();
    const logged = loggerError.mock.calls.flat().join(' ');
    expect(logged).toContain('network down');
    expect(logged).not.toContain('secret');
  });

  it('skips sending when RESEND_API_KEY is unset', async () => {
    const service = new MailService(buildConfig({ resend_api_key: undefined as unknown as string }));
    const loggerWarn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await expect(service.sendPasswordReset('a@b.com', 'http://link')).resolves.toBeUndefined();
    expect(loggerWarn).toHaveBeenCalled();
  });
});
