import { POST } from '@/web/common/api/requestStudent';

export const getClientUserSmsCode = ({
  bizType,
  mobile,
  newMobile,
  ticket,
  moveLength
}: {
  bizType: number;
  mobile: string;
  newMobile?: string;
  ticket?: string;
  moveLength?: number;
}): Promise<any> => {
  const searchParams = new URLSearchParams({
    bizType: String(bizType),
    mobile
  });
  const normalizedMoveLength =
    moveLength !== undefined && Number.isFinite(moveLength) ? Math.trunc(moveLength) : undefined;

  if (newMobile) searchParams.set('newMobile', newMobile);
  if (ticket !== undefined) searchParams.set('ticket', ticket);
  if (normalizedMoveLength !== undefined) {
    searchParams.set('moveLength', String(normalizedMoveLength));
  }
  return POST(`/client/user/smsCode?${searchParams.toString()}`, '');
};

export const postValidSmsCode = (params: {
  bizType: number;
  code: string;
  mobile: string;
}): Promise<any> => {
  const searchParams = new URLSearchParams({
    bizType: String(params.bizType),
    code: params.code,
    mobile: params.mobile
  });
  return POST(`/client/user/valid?${searchParams.toString()}`, '');
};

export const postChangePhoneNum = (data: {
  bizType: number;
  mobile: string;
  code: string;
}): Promise<any> => POST('/client/user/changePhoneNum', data);

export const postBindPhone = (data: {
  bizType: number;
  mobile: string;
  code: string;
}): Promise<any> => POST('/client/user/bindPhone', data);
