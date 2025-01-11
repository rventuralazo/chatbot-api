import { Injectable } from '@nestjs/common';

@Injectable()
export class SheinService {
  private readonly DEFAULT_SHIPPING = 20;
  async getEstimatedDeliveryDate() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + this.DEFAULT_SHIPPING);
    return currentDate;
  }
}
