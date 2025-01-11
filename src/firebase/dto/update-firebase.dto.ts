import { DocumentFieldValue } from '@google-cloud/firestore';
import { DefaultFirebaseDto } from './default-firebase.dto';

export class UpdateFirebaseDto extends DefaultFirebaseDto {
  id: string;
  data: DocumentFieldValue;
}
