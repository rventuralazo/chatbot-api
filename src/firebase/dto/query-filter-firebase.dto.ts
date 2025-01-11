import type { WhereFilterOp } from '@google-cloud/firestore';

export class QueryFilterFirebaseDto {
  field: string;
  operator: WhereFilterOp;
  value: any;
}
