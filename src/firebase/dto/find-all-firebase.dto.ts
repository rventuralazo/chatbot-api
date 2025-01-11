import { DefaultFirebaseDto } from './default-firebase.dto';
import { QueryFilterFirebaseDto } from './query-filter-firebase.dto';
import { QueryPaginationFirebaseDto } from './query-pagination-firebase.dto';
import { QuerySortFirebaseDto } from './query-sort-firebase.dto';

export class FindAllFirebaseDto extends DefaultFirebaseDto {
  filters?: QueryFilterFirebaseDto[];
  sorts?: QuerySortFirebaseDto[];
  pagination?: QueryPaginationFirebaseDto;
}
