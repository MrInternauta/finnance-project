import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalInfoService } from '../../../core/services/modal.service';
import { AuthService } from '../../services/auth.service';

@Component({
    templateUrl: './forget-pass.component.html'
})

export class ForgetPassComponent implements OnInit {
  myForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private modalInfoService: ModalInfoService
  ) {}

  ngOnInit() {
    this.myForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.email]]
    });
  }

  submitForm() {
    for (const i in this.myForm.controls) {
      this.myForm.controls[i].markAsDirty();
      this.myForm.controls[i].updateValueAndValidity();
    }
    if (this.myForm.invalid) {
      return;
    }
    this.authService.forgotPassword(this.myForm.value.userName).subscribe({
      next: () => {
        // Always the same message so the form can't be used to enumerate users.
        this.modalInfoService.success('Si el correo existe, te enviamos un enlace para restablecer tu contraseña', '');
        this.myForm.reset();
      },
      error: () => {
        this.modalInfoService.success('Si el correo existe, te enviamos un enlace para restablecer tu contraseña', '');
      },
    });
  }
}
