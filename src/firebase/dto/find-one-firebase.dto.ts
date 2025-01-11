import { DefaultFirebaseDto } from './default-firebase.dto';
import { QueryFilterFirebaseDto } from './query-filter-firebase.dto';

export class FindOneFirebaseDto extends DefaultFirebaseDto {
  filters: QueryFilterFirebaseDto[];
}
