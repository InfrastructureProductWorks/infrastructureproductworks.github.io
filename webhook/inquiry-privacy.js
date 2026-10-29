export const INQUIRY_NOTICE_VERSION = 'inquiry-2026-10-29';
export const INQUIRY_PURPOSE = 'inquiry-response';

// A purpose-specific request, not marketing permission or contract acceptance.
export function hasInquiryRequest(input) {
  return input !== null && typeof input === 'object' && !Array.isArray(input) &&
    (input.inquiryProcessing === true || input.inquiryProcessing === 'requested') &&
    input.privacyNoticeVersion === INQUIRY_NOTICE_VERSION;
}
