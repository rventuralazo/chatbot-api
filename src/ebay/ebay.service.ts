import { Injectable } from '@nestjs/common';
import { getQuickestShippingDate } from '../chatbot/utils/ebay';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';

@Injectable()
export class EbayService {
  DEFAULT_EBAY_SHIPPING = 15;
  constructor(
    private readonly driverService: DriverService,
    private readonly tripService: TripService,
  ) {}

  async getEstimatedDeliveryDate(product: any) {
    const trips = await this.tripService.getAvailableTrips();
    const drivers = await this.driverService.getAvailableDrivers();
    const now = new Date();
    const deliveryDate = getQuickestShippingDate(
      product?.shippingOptions?.map(
        (shipping: any) => shipping?.maxEstimatedDeliveryDate,
      ) ?? [],
    );
    if (!deliveryDate) {
      now.setDate(now.getDate() + this.DEFAULT_EBAY_SHIPPING);
      return now;
    }
    const filterTrips = trips?.filter(
      (trip: any) => new Date(trip?.date) > deliveryDate,
    );
    const dateOptimization = filterTrips?.find((trip: any) => {
      const driver = drivers?.find(
        (user: any) => user?.uid === trip.travelerUid,
      );
      if (!driver) return false;
      const dayBeforeTravel = Number.parseInt(driver.dayBeforeTravel) ?? 3;
      const travelDate = new Date(trip.date);
      travelDate.setDate(travelDate.getDate() - dayBeforeTravel);
      return deliveryDate <= travelDate;
    });
    if (!dateOptimization) {
      const fallbackDate = new Date(deliveryDate);
      fallbackDate.setDate(fallbackDate.getDate() + this.DEFAULT_EBAY_SHIPPING);
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
