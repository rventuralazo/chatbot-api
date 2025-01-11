import { DocumentFieldValue } from '@google-cloud/firestore';
import { DefaultFirebaseDto } from './default-firebase.dto';

export class CreateFirebaseDto extends DefaultFirebaseDto {
  data: DocumentFieldValue;
}
