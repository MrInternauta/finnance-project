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
    public readonly productService: WorkoutService,
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
    console.log(this.productService.product);
    if (this.productService.product) {
      
      this.name = this.productService.product?.name;
      this.date = this.productService.product?.date?.toString();
      this.description = this.productService.product?.description;
      this.outcome = !this.productService.product?.income;
      this.categoryId = this.productService.product?.category?.id?.toString() || '';
      this.quantity = this.productService.product?.quantity.toString();
      console.log(this.productService.product);
    }
  }

  getImage() {
    if (!this.productService.product?.id) {
      return;
    }

    // this.pictureService.changePicture(this.productService.product?.id ?? '', 'product');
  }

  getCategories() {
    this.productService.getCategories().subscribe(categoriesResponse => {
      this.categories =
        categoriesResponse?.categories.map(item => {
          return {
            name: item.name,
            value: item.id.toString(),
            selected:
              item.id?.toString()?.toLocaleLowerCase() === this.productService.product?.category?.id?.toString()?.toLocaleLowerCase(),
          };
        }) || [];
    });
  }

  // public cancel() {
  //   this.removeSubscription();
  //   return this.modalCtrl.dismiss(null, 'cancel');
  // }

  confirm() {
    this.fillEmptyForm();

    // if (!this.productService.product || (this.productService.product?.code && !this.productService.product?.id)) {
    //   const product: ArticleCreate = {
    //     name: this.name,
    //     code: this.code,
    //     stock: this.stock,
    //     price: this.price,
    //     priceSell: this.price_sell,
    //     description: this.description,
    //     categoryId: this.categoryId,
    //   };

    //   this.subscription$ = this.productService.productService.postProduct(product).subscribe(
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
    //   id: Number(this.productService.product.id),
    //   name: this.name,
    //   code: this.code,
    //   stock: this.stock,
    //   price: this.price,
    //   priceSell: this.price_sell,
    //   description: this.description,
    //   categoryId: this.categoryId,
    // };
    // this.subscription$ = this.productService.productService.putProduct(this.productService.product.id, product).subscribe(
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
    this.date = event?.toString() || '';
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

  public changeSelect(event: any) {
    console.log(event);
    
    // this.categoryId = event;
    this.didSomeChange = true;
  }

  fillEmptyForm() {
    if (!this.description) {
      this.description = '';
    }
  }

  removeSubscription() {
    this.subscription$?.unsubscribe();
    this.subscriptionCategories$?.unsubscribe();
    this.name = '';
    this.date = new Date()?.toString();
    this.quantity = '';
    this.outcome = true;
    this.description = '';
    this.productService.product = null;
  }

  ngOnDestroy(): void {
    this?.removeSubscription();
  }
}
