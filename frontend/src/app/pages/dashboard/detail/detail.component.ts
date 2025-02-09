import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { ISelectItem } from '../../../core/models/iselect.item';
import { ModalInfoService } from '../../../core/services/modal.service';
import { PictureService } from '../../../core/services/picture.service';
import { ArticleCreate, ArticleItemResponse } from '../models';
import { WorkoutService } from '../services/workout.service';
import { Router } from '@angular/router';

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
    private pictureService: PictureService,
    public router: Router,
  ) {
    this.getCategories();
  }

  get isValidForm() {
    //Required fields
    if (!this.name) {
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

    console.log(this.name, this.date, this.quantity, this.outcome, this.description, this.categoryId);
    
    this.fillEmptyForm();
    //method that use productService to post or put a product
    //build the object to send to the service
    // and validate fields before sending or keep those as null
    const product: ArticleCreate = {
      name: this.name,
      date: this.date ? new Date(this.date): new Date(),
      quantity: parseInt(this.quantity || '0'),
      income: !this.outcome,
      description: this.description,
      categoryId: Number(this.categoryId || 6), //default category is 6 (others)
    };

    console.log(product);
    //determine if it is a post or put by the existence of the product id
    this.subscription$ = (product.id  ? this.productService.putProduct(String(this.productService.product?.id), product) : this.productService.postProduct(product))
    
    //handle put or post response
    .subscribe(
      (response: ArticleItemResponse) => {
        console.log(response);
        this.modalInfoService.success('Success!', 'Movement saved successfully');
        this.removeSubscription();
        this.modalCtrl.dismiss(response, 'confirm');
        //move to dashboard page and refresh the list
        this.router.navigate(['tabs', 'tab1', 'detail'], );
        this.removeSubscription();
        


      },
      error => {
        console.log(error);
        // this.modalInfoService.error('Error saving product');
      });

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
