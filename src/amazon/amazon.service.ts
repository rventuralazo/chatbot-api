import { Injectable } from '@nestjs/common';
import { parseDate } from '../common/utils/date';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';

@Injectable()
export class AmazonService {
  private readonly DEFAULT_AMAZON_SHIPPING = 15;
  constructor(
    private readonly driverService: DriverService,
    private readonly tripService: TripService,
  ) {}
  public async getEstimatedDeliveryDate(product: any) {
    const trips = await this.tripService.getAvailableTrips();
    const drivers = await this.driverService.getAvailableDrivers();
    const now = new Date();
    const dateKey =
      product?.prime_shipping_info ?? product?.shipping_info ?? null;
    const dateAmazon = dateKey ? parseDate(dateKey) : null;
    if (!dateAmazon) {
      now.setDate(now.getDate() + this.DEFAULT_AMAZON_SHIPPING);
      return now;
    }
    const filterTrips = trips?.filter(
      (trip: any) => new Date(trip?.date) > dateAmazon,
    );
    const dateOptimization = filterTrips?.find((trip: any) => {
      const driver = drivers?.find(
        (user: any) => user?.uid === trip.travelerUid,
      );
      if (!driver) return false;
      const dayBeforeTravel = Number.parseInt(driver.dayBeforeTravel) ?? 3;
      const travelDate = new Date(trip.date);
      travelDate.setDate(travelDate.getDate() - dayBeforeTravel);
      return dateAmazon <= travelDate;
    });
    if (!dateOptimization) {
      const fallbackDate = new Date(dateAmazon);
      fallbackDate.setDate(
        fallbackDate.getDate() + this.DEFAULT_AMAZON_SHIPPING,
      );
      return fallbackDate;
    }
    const dateTravel = new Date(dateOptimization.date);
    const daysAfterTravel =
      Number.parseInt(
        drivers?.find((user: any) => user?.uid === dateOptimization.travelerUid)
          ?.dayAfterTravel,
      ) ?? 3;
    dateTravel.setDate(dateTravel.getDate() + daysAfterTravel);
    return dateTravel;
  }
}
