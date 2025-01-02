import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { ISelectItem } from '../../../core/models/iselect.item';
import { ModalInfoService } from '../../../core/services/modal.service';
import { PictureService } from '../../../core/services/picture.service';
import { ArticleCreate, ArticleItemResponse } from '../models';
import { WorkoutService } from '../services/workout.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnDestroy, OnInit {
  @Input() product?: ArticleItemResponse | null = null;
  name!: string;
  date!: string;
  quantity!: string;
  outcome!: boolean;
  description!: string;
  categoryId!: string;
  subscription$!: Subscription;
  subscriptionCategories$!: Subscription;
  categories!: Array<ISelectItem>;
  didSomeChange!: boolean;
  constructor(
    private productService: WorkoutService,
    private modalInfoService: ModalInfoService,
    private modalCtrl: ModalController,
    private pictureService: PictureService
  ) {
    this.getCategories();
  }

  get isValidForm() {
    //Required fields
    if (!this.name) {
      return false;
    }

    if (!this.date) {
      return false;
    }

    if (!this.quantity) {
      return false;
    }

    //Required fields
    if (!this.didSomeChange) {
      return false;
    }

    return true;
  }

  ngOnInit(): void {
    if (this.product) {
      this.name = this.product?.name;
      this.date = this.product?.date.toISOString();
      this.description = this.product?.description;
      this.outcome = !this.product?.income;
      this.categoryId = this.product?.category?.id?.toString() || '';
      this.quantity = this.product?.quantity.toString();
      console.log(this.product);
    }
  }

  getImage() {
    if (!this.product?.id) {
      return;
    }

    // this.pictureService.changePicture(this.product?.id ?? '', 'product');
  }

  getCategories() {
    this.productService.getCategories().subscribe(categoriesResponse => {
      this.categories =
        categoriesResponse?.categories.map(item => {
          return {
            name: item.name,
            value: item.id.toString(),
            selected:
              item.id?.toString()?.toLocaleLowerCase() === this.product?.category?.id?.toString()?.toLocaleLowerCase(),
          };
        }) || [];
    });
  }

  public cancel() {
    this.removeSubscription();
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    this.fillEmptyForm();

    // if (!this.product || (this.product?.code && !this.product?.id)) {
    //   const product: ArticleCreate = {
    //     name: this.name,
    //     code: this.code,
    //     stock: this.stock,
    //     price: this.price,
    //     priceSell: this.price_sell,
    //     description: this.description,
    //     categoryId: this.categoryId,
    //   };

    //   this.subscription$ = this.productService.postProduct(product).subscribe(
    //     res => {
    //       this.removeSubscription();
    //       this.modalInfoService.success('El producto fue creado!', '');
    //       return this.modalCtrl.dismiss(res, 'created');
    //     },
    //     error => {
    //       console.log(error);
    //     }
    //   );
    //   return;
    // }

    // const product: ArticleCreate = {
    //   id: Number(this.product.id),
    //   name: this.name,
    //   code: this.code,
    //   stock: this.stock,
    //   price: this.price,
    //   priceSell: this.price_sell,
    //   description: this.description,
    //   categoryId: this.categoryId,
    // };
    // this.subscription$ = this.productService.putProduct(this.product.id, product).subscribe(
    //   res => {
    //     this.removeSubscription();
    //     this.modalInfoService.success('El producto fue actualizado!', '');
    //     return this.modalCtrl.dismiss(res, 'updated');
    //   },
    //   error => {
    //     console.log(error);
    //   }
    // );
  }

  public changeName(event: string) {
    this.name = event;
    this.didSomeChange = true;
  }

  public changeDate(event: Date) {
    this.date = event?.toISOString() || '';
    this.didSomeChange = true;
  }

  public changeQuantity(event: string) {
    this.quantity = event;
    this.didSomeChange = true;
  }

  public changeOutcome(event: boolean) {
    this.outcome = event;
    this.didSomeChange = true;
  }

  public changeDescription(event: string) {
    this.description = event;
    this.didSomeChange = true;
  }

  public changeSelect(event: string) {
    this.categoryId = event;
    this.didSomeChange = true;
  }

  fillEmptyForm() {
    if (!this.description) {
      this.description = '';
    }
  }

  removeSubscription() {
    this.subscription$?.unsubscribe();
    // this.subscriptionCategories$?.unsubscribe();
    this.name = '';
    this.date = new Date()?.toISOString() || '';
    this.quantity = '';
    this.outcome = true;
    this.description = '';
    this.product = null;
  }

  ngOnDestroy(): void {
    this?.removeSubscription();
  }
}
