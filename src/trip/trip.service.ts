import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class TripService {
  constructor(private readonly firebase: FirebaseService) {}

  async getAvailableTrips() {
    return await this.firebase.findAll({
      collection: 'Trips',
      filters: [
        { field: 'date', operator: '>', value: new Date().toISOString() },
      ],
      sorts: [{ field: 'date', direction: 'asc' }],
    });
  }
}
