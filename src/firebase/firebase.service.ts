import { DocumentSnapshot, Query } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { CountFirebaseDto } from './dto/count-firebase.dto';
import { CreateFirebaseDto } from './dto/create-firebase.dto';
import { FindAllFirebaseDto } from './dto/find-all-firebase.dto';
import { FindByIdFirebaseDto } from './dto/find-by-id-firebase.dto';
import { FindOneFirebaseDto } from './dto/find-one-firebase.dto';
import { RemoveFirebaseDto } from './dto/remove-firebase.dto';
import { UpdateFirebaseDto } from './dto/update-firebase.dto';

@Injectable()
export class FirebaseService {
  private database: FirebaseFirestore.Firestore;

  constructor(@InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin) {
    this.database ??= this.firebase.firestore;
  }

  async create(createFirebaseDto: CreateFirebaseDto): Promise<any> {
    const document = await this.database
      .collection(createFirebaseDto.collection)
      .add(this.sanitizePayload(createFirebaseDto.data));
    return {
      ...createFirebaseDto.data,
      id: document.id,
    };
  }

  async findAll(findAllFirebaseDto: FindAllFirebaseDto): Promise<any[]> {
    // Filter data based on the query filters
    let query: Query = this.database.collection(findAllFirebaseDto.collection);
    if (findAllFirebaseDto.filters && findAllFirebaseDto.filters.length > 0) {
      findAllFirebaseDto.filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }
    // Order data based on the query sort fields
    if (findAllFirebaseDto.sorts && findAllFirebaseDto.sorts.length > 0) {
      findAllFirebaseDto.sorts.forEach((orderBy) => {
        query = query.orderBy(orderBy.field, orderBy.direction);
      });
    }
    // Paginate data based on the query pagination
    if (findAllFirebaseDto.pagination) {
      query = query.limit(findAllFirebaseDto.pagination.limit);
      if (findAllFirebaseDto.pagination.offset)
        query = query.offset(findAllFirebaseDto.pagination.offset);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  async findById(firebaseFindByIdDto: FindByIdFirebaseDto): Promise<any> {
    const document: DocumentSnapshot = await this.database
      .collection(firebaseFindByIdDto.collection)
      .doc(firebaseFindByIdDto.id)
      .get();
    return {
      ...document.data(),
      id: document.id,
    };
  }

  async findOne(firebaseFindOneDto: FindOneFirebaseDto): Promise<any> {
    let query: Query = this.database.collection(firebaseFindOneDto.collection);
    if (firebaseFindOneDto.filters && firebaseFindOneDto.filters.length > 0) {
      firebaseFindOneDto.filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }))[0];
  }

  async update(firebaseUpdateDto: UpdateFirebaseDto): Promise<any> {
    await this.database
      .collection(firebaseUpdateDto.collection)
      .doc(firebaseUpdateDto.id)
      .update(this.sanitizePayload(firebaseUpdateDto.data));
    return firebaseUpdateDto;
  }

  async remove(removeDto: RemoveFirebaseDto): Promise<any> {
    await this.database
      .collection(removeDto.collection)
      .doc(removeDto.id)
      .delete();
    return removeDto;
  }

  async count(countFirebaseDto: CountFirebaseDto): Promise<number> {
    const snapshot = await this.database
      .collection(countFirebaseDto.collection)
      .get();
    return snapshot.size;
  }

  private sanitizePayload(object: any, defaultValue = null): any {
    if (object && typeof object === 'object')
      Object.entries(object).forEach(([key, value]) => {
        object[key] =
          value === undefined ? defaultValue : this.sanitizePayload(value);
      });
    return object;
  }

  async upload(file: Buffer, fileName: string): Promise<string> {
    const storage = this.firebase.storage;
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);
    await fileRef.save(file);
    await fileRef.makePublic();
    return fileRef.publicUrl();
  }
}
