import type { OrderByDirection } from '@google-cloud/firestore';

export class QuerySortFirebaseDto {
  field: string;
  direction?: OrderByDirection;
}
