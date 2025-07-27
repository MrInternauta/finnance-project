import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@gymTrack/auth';
import { AppState, Auth, ComponentBase } from '@gymTrack/core';
import { isEmail } from '@gymTrack/core/util/validator.helper';
import { Store } from '@ngrx/store';
import { UserDto } from '../../model/user.dto';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage extends ComponentBase implements OnInit, OnDestroy {
  isLoading = false;
  passwordVisible = false;
  email!: string;
  password!: string;
  public hasError: {
    email: string;
    password: string;
    login: string;
  } = {
    email: '',
    password: '',
    login: '',
  };
  recuerdame = false;
  constructor(
    private _authService: AuthService,
    private _store: Store<AppState>,
    public router: Router
  ) {
    super();
    const email = localStorage.getItem('email') ?? '';
    if (email.length > 3 && isEmail(email)) {
      this.recuerdame = true;
      this.email = email;
    }
    this.hasError = {
      email: '',
      password: '',
      login: '',
    };
    this.email = 'admin@admin.com';
    this.password = '1234567890';
  }

  ngOnInit() {
    return;
  }
  handleEmail(value: string) {
    this.email = value;
  }
  handlePassword(value: string) {
    this.password = value;
  }
  onSubmit() {
    if (!this.email) {
      this.hasError.email = 'Email address is needed';
      return;
    }

    if (!this.password) {
      this.hasError.password = 'Password is needed';
      return;
    }

    const auth: Auth = {
      email: this.email,
      password: this.password,
    };
    //TODO: Get permissions
    this._authService.login(auth as UserDto, this.recuerdame).subscribe(
      res => {
        this.hasError = {
          email: '',
          password: '',
          login: '',
        };
        if (!res) {
          this.hasError.login = 'Something is wrong!';
          return;
        }
        this.router.navigate(['tabs'], { replaceUrl: true });
      },
      login => {
        console.log(login);

        this.hasError = {
          email: '',
          password: '',
          login,
        };
        this.hasError.login = 'Something is wrong!';
      }
    );
  }
  resetPassword() {}
  siginupRedirect() {
    this.router.navigate(['signup'], { replaceUrl: true });
  }
}
