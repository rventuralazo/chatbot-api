import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DriverService {
  constructor(private readonly firebase: FirebaseService) {}

  async getAvailableDrivers() {
    return await this.firebase.findAll({
      collection: 'Users',
      filters: [
        { field: 'type', operator: '==', value: 'driver' },
        { field: 'driverStatus', operator: '==', value: true },
      ],
    });
  }
}
