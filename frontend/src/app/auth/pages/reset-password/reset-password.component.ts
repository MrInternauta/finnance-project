import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ModalInfoService } from '../../../core/services/modal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  myForm!: FormGroup;
  private token = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private modalInfoService: ModalInfoService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.activatedRoute.snapshot.queryParamMap.get('token') || '';
    this.myForm = this.formBuilder.group({
      password: [null, [Validators.required]],
      checkPassword: [null, [Validators.required, this.confirmationValidator]],
    });
  }

  confirmationValidator = (control: FormControl): any => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.myForm?.controls['password']?.value) {
      return { confirm: true, error: true };
    }
  };

  submitForm() {
    for (const i in this.myForm.controls) {
      this.myForm.controls[i].markAsDirty();
      this.myForm.controls[i].updateValueAndValidity();
    }
    if (this.myForm.invalid || !this.token) {
      if (!this.token) {
        this.modalInfoService.error('El enlace no es válido', '');
      }
      return;
    }
    this.authService.resetPassword(this.token, this.myForm.value.password).subscribe({
      next: () => {
        this.modalInfoService.success('Tu contraseña fue actualizada', '', () => {
          this.router.navigate(['authentication', 'login-1']);
        });
      },
      error: err => {
        this.modalInfoService.error(err?.error?.message || 'El enlace es inválido o expiró', '');
      },
    });
  }
}
