export const AGREEMENT_TYPES = {
  SERVICE_TERMS: 'service_terms',
  PRIVACY_POLICY: 'privacy_policy',
  AGE_VERIFICATION: 'age_verification',
  MARKETING_CONSENT: 'marketing_consent',
  LOCATION_CONSENT: 'location_consent',
  EVENT_NOTIFICATIONS: 'event_notifications',
  SMS_NOTIFICATIONS: 'sms_notifications',
  EMAIL_NOTIFICATIONS: 'email_notifications',
  PUSH_NOTIFICATIONS: 'push_notifications',
  DATA_ANALYSIS: 'data_analysis',
  THIRD_PARTY_SHARING: 'third_party_sharing'
} as const;

export const REQUIRED_AGREEMENTS = [
  AGREEMENT_TYPES.SERVICE_TERMS,
  AGREEMENT_TYPES.PRIVACY_POLICY,
  AGREEMENT_TYPES.AGE_VERIFICATION,
  AGREEMENT_TYPES.MARKETING_CONSENT
] as const;

export const OPTIONAL_AGREEMENTS = [
  AGREEMENT_TYPES.LOCATION_CONSENT,
  AGREEMENT_TYPES.EVENT_NOTIFICATIONS,
  AGREEMENT_TYPES.SMS_NOTIFICATIONS,
  AGREEMENT_TYPES.EMAIL_NOTIFICATIONS,
  AGREEMENT_TYPES.PUSH_NOTIFICATIONS,
  AGREEMENT_TYPES.DATA_ANALYSIS,
  AGREEMENT_TYPES.THIRD_PARTY_SHARING
] as const;

export const AGREEMENT_LABELS = {
  [AGREEMENT_TYPES.SERVICE_TERMS]: '서비스 이용약관 (필수)',
  [AGREEMENT_TYPES.PRIVACY_POLICY]: '개인정보 처리방침 (필수)',
  [AGREEMENT_TYPES.AGE_VERIFICATION]: '만 14세 이상 (필수)',
  [AGREEMENT_TYPES.MARKETING_CONSENT]: '마케팅 정보 수신 동의 (필수)',
  [AGREEMENT_TYPES.LOCATION_CONSENT]: '위치정보 이용동의 (선택)',
  [AGREEMENT_TYPES.EVENT_NOTIFICATIONS]: '이벤트 알림 (선택)',
  [AGREEMENT_TYPES.SMS_NOTIFICATIONS]: 'SMS 알림 (선택)',
  [AGREEMENT_TYPES.EMAIL_NOTIFICATIONS]: '이메일 알림 (선택)',
  [AGREEMENT_TYPES.PUSH_NOTIFICATIONS]: '푸시 알림 (선택)',
  [AGREEMENT_TYPES.DATA_ANALYSIS]: '데이터 분석 활용 (선택)',
  [AGREEMENT_TYPES.THIRD_PARTY_SHARING]: '제3자 정보 제공 (선택)'
} as const; 