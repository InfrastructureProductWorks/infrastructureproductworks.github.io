'use strict';

// A presentation projection only. The gate result and its evidence remain authoritative.
window.assurancePlainLanguage=function({decision,outcome,reasonCode}){
  const translations={
    RECONCILIATION_APPLIED:{decision:'Allowed for this bounded change',action:'The synthetic change was applied and verified.',why:'The authority, scope, approvals and state checks passed.',next:'No review is needed for this fixture result.'},
    AUTHORITY_EXPIRED:{decision:'Stopped',action:'No change was made.',why:'The authorization had expired when this request was checked.',next:'The requester needs fresh authority before submitting again.'},
    APPROVAL_THRESHOLD_NOT_MET:{decision:'Waiting for approval',action:'No change was made.',why:'The request did not have the required independent approvals.',next:'An authorized approver must review it before a new evaluation.'},
    AUTHORITY_REFERENCE_MISMATCH:{decision:'Stopped',action:'No change was made.',why:'The request referenced a different authority package.',next:'The requester must correct the authority reference and submit again.'},
    AUTHORITY_DIGEST_MISMATCH:{decision:'Stopped',action:'No change was made.',why:'The authority package did not match its recorded fingerprint.',next:'The requester must provide a valid package and submit again.'},
    REQUESTER_OR_PURPOSE_MISMATCH:{decision:'Stopped',action:'No change was made.',why:'The requester or purpose did not match the authority.',next:'The requester must obtain authority for the correct identity and purpose.'},
    BLAST_RADIUS_EXCEEDED:{decision:'Stopped',action:'No change was made.',why:'The request covered more than the authorized resource.',next:'The requester must narrow the scope or obtain appropriate authority.'},
    OBSERVED_STATE_DIGEST_MISMATCH:{decision:'Stopped',action:'No change was made.',why:'The recorded state did not match the state being evaluated.',next:'The requester must refresh the state evidence and submit again.'},
    FIELD_NOT_MANAGED:{decision:'Stopped',action:'No change was made.',why:'The proposed field was outside the managed change.',next:'The requester must correct the requested field or seek the right authority.'},
    ROLLBACK_OR_NOTIFICATION_NOT_PROVEN:{decision:'Stopped',action:'No change was made.',why:'Rollback or independent notification was not proven ready.',next:'The responsible operator must restore those safeguards before retrying.'},
    VERIFICATION_FAILED_ROLLBACK_SUCCEEDED:{decision:'Allowed, then rolled back',action:'The synthetic change was attempted and rolled back.',why:'Verification failed after the change.',next:'The responsible operator must investigate before another attempt.'}
  };
  const item=translations[reasonCode];
  const expected={RECONCILIATION_APPLIED:['ALLOW','APPLIED'],APPROVAL_THRESHOLD_NOT_MET:['DENY','REVIEW REQUIRED'],VERIFICATION_FAILED_ROLLBACK_SUCCEEDED:['ALLOW','ROLLED BACK']};
  const pair=expected[reasonCode]||['DENY','NO ACTION'];
  if(!item||decision!==pair[0]||outcome!==pair[1])return {decision:'Explanation unavailable',action:'Consult the technical result.',why:'This combination has no verified plain-language translation.',next:'The responsible reviewer should inspect the underlying record.'};
  return item;
};
